import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';

export type SyncOrdersApiResponse = {
  synced: number;
  ordersProcessed: number;
  error?: string;
};

const EXCLUDED_STATUSES = [
  'CANCELLED',
  'PARTIALLY_CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DRAFT',
];

const PRODUCT_PAGE_LIMIT = 100;
// Safety cap on product pagination so a very large catalog can't loop forever
// while we search for the (small) set of productIds referenced by recent orders.
const MAX_PRODUCT_PAGES = 50;

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });

  const settings = await prisma.storeSettings.findUnique({
    where: { merchantId: user.merchantId },
  });
  const maxNotifications = settings?.syncOrderCount ?? 20;

  const ikasClient = getIkas(authToken);

  // 1. Fetch recent orders via getIkas (auto token refresh on expiry)
  const orderResponse = await ikasClient.queries.listOrder({
    pagination: { limit: 100, page: 1 },
    sort: '-createdAt',
  });

  if (!orderResponse.isSuccess || !orderResponse.data?.listOrder) {
    console.error(
      '[sync-orders] Failed to fetch orders:',
      orderResponse.error ?? orderResponse.errors,
    );
    return NextResponse.json({
      data: {
        synced: 0,
        ordersProcessed: 0,
        error: 'Siparişler alınamadı. Lütfen tekrar deneyin.',
      },
    });
  }

  const orders = orderResponse.data.listOrder.data ?? [];

  // 2. Filter valid orders
  const validOrders = orders.filter((o) => !o.status || !EXCLUDED_STATUSES.includes(o.status));

  if (validOrders.length === 0) {
    return NextResponse.json({
      data: { synced: 0, ordersProcessed: 0, error: 'Geçerli sipariş bulunamadı.' },
    });
  }

  // 3. Collect unique productIds referenced by valid orders
  const productIds = new Set<string>();
  for (const order of validOrders) {
    for (const item of order.orderLineItems ?? []) {
      if (item.variant?.productId) productIds.add(item.variant.productId);
    }
  }

  // 4. Fetch product details via getIkas (auto token refresh). listProduct only
  //    supports search/pagination (no id-array filter), so page through the
  //    catalog and match client-side against the needed productIds, stopping
  //    early once every needed product has been resolved.
  const productMap = new Map<string, { name: string; slug: string; imageId: string | null }>();

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const productResponse = await ikasClient.queries.listProduct({
      pagination: { limit: PRODUCT_PAGE_LIMIT, page },
    });

    if (!productResponse.isSuccess || !productResponse.data?.listProduct) {
      console.error(
        '[sync-orders] Failed to fetch products:',
        productResponse.error ?? productResponse.errors,
      );
      break;
    }

    const pageData = productResponse.data.listProduct.data ?? [];
    for (const p of pageData) {
      if (!p.name || !productIds.has(p.id)) continue;
      let imageId: string | null = null;
      for (const v of p.variants ?? []) {
        const mainImg = (v.images ?? []).find((i) => i.isMain);
        if (mainImg?.imageId) {
          imageId = mainImg.imageId;
          break;
        }
      }
      productMap.set(p.id, {
        name: p.name,
        slug: p.metaData?.slug || '',
        imageId,
      });
    }

    // Stop once every referenced product is resolved, or we've hit the last page.
    if (productMap.size >= productIds.size || pageData.length < PRODUCT_PAGE_LIMIT) break;
  }

  if (productMap.size === 0) {
    return NextResponse.json({
      data: {
        synced: 0,
        ordersProcessed: validOrders.length,
        error: 'Siparişlerdeki ürünler mağazada bulunamadı.',
      },
    });
  }

  // 5. Build new entries in memory FIRST (atomic swap — never delete before we
  //    know we have replacement data)
  const newEntries: {
    merchantId: string;
    source: string;
    customerName: string;
    location: string;
    productId: string | null;
    productName: string;
    productImage: string | null;
    productHref: string | null;
    purchaseDate: Date;
    isPrioritized: boolean;
    isActive: boolean;
  }[] = [];

  const seenProducts = new Set<string>();

  for (const order of validOrders) {
    if (newEntries.length >= maxNotifications) break;

    const customerName =
      order.shippingAddress?.firstName ?? order.billingAddress?.firstName ?? 'Müşteri';
    const location = order.shippingAddress?.city?.name ?? order.billingAddress?.city?.name ?? '';

    for (const item of order.orderLineItems ?? []) {
      if (newEntries.length >= maxNotifications) break;

      const pid = item.variant?.productId;
      if (!pid) continue;

      // Skip duplicate products across orders
      const dedupKey = `${customerName}-${pid}`;
      if (seenProducts.has(dedupKey)) continue;
      seenProducts.add(dedupKey);

      const product = productMap.get(pid);
      if (!product) continue; // Product deleted/inactive, or not found within page cap

      const imageUrl = product.imageId
        ? `https://cdn.myikas.com/images/${user.merchantId}/${product.imageId}/180/${product.imageId}.webp`
        : null;

      newEntries.push({
        merchantId: user.merchantId,
        source: 'webhook',
        customerName,
        location,
        productId: pid,
        productName: product.name,
        productImage: imageUrl,
        productHref: product.slug ? `/${product.slug}` : null,
        purchaseDate: order.createdAt ? new Date(order.createdAt) : new Date(),
        isPrioritized: false,
        isActive: true,
      });
    }
  }

  if (newEntries.length === 0) {
    return NextResponse.json({
      data: {
        synced: 0,
        ordersProcessed: validOrders.length,
        error: 'Eşleşen ürünlü sipariş bulunamadı.',
      },
    });
  }

  // 6. ATOMIC SWAP: delete old + create new in a single transaction. If create
  //    fails for any reason, the delete is rolled back too — no data loss.
  await prisma.$transaction([
    prisma.notificationEntry.deleteMany({
      where: { merchantId: user.merchantId, source: 'webhook' },
    }),
    ...newEntries.map((entry) => prisma.notificationEntry.create({ data: entry })),
  ]);

  return NextResponse.json({
    data: { synced: newEntries.length, ordersProcessed: validOrders.length },
  });
}
