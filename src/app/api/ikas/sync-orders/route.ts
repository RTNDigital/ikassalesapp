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
  const lastSyncedAt = settings?.lastSyncedAt;

  const ikasClient = getIkas(authToken);

  const orderVars: { pagination: { limit: number; page: number }; sort: string; orderedAt?: { gte: number } } = {
    pagination: { limit: 100, page: 1 },
    sort: '-orderedAt',
  };
  if (lastSyncedAt) {
    orderVars.orderedAt = { gte: lastSyncedAt.getTime() };
  }
  const orderResponse = await ikasClient.queries.listOrder(orderVars);

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

  const validOrders = orders.filter((o) => {
    if (o.status && EXCLUDED_STATUSES.includes(o.status)) return false;
    return true;
  });

  if (validOrders.length === 0) {
    await prisma.storeSettings.update({
      where: { merchantId: user.merchantId },
      data: { lastSyncedAt: new Date() },
    });
    return NextResponse.json({
      data: { synced: 0, ordersProcessed: 0, error: lastSyncedAt ? 'Son senkronizasyondan bu yana yeni sipariş yok.' : 'Geçerli sipariş bulunamadı.' },
    });
  }

  // Collect unique productIds referenced by valid orders
  const productIds = new Set<string>();
  for (const order of validOrders) {
    for (const item of order.orderLineItems ?? []) {
      if (item.variant?.productId) productIds.add(item.variant.productId);
    }
  }

  // Fetch product details
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

  // Build new entries from only NEW orders
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

      const dedupKey = `${customerName}-${pid}`;
      if (seenProducts.has(dedupKey)) continue;
      seenProducts.add(dedupKey);

      const product = productMap.get(pid);
      if (!product) continue;

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
        purchaseDate: order.orderedAt ? new Date(order.orderedAt) : order.createdAt ? new Date(order.createdAt) : new Date(),
        isPrioritized: false,
        isActive: true,
      });
    }
  }

  if (newEntries.length === 0) {
    if (settings) {
      await prisma.storeSettings.update({
        where: { merchantId: user.merchantId },
        data: { lastSyncedAt: new Date() },
      });
    }
    return NextResponse.json({
      data: {
        synced: 0,
        ordersProcessed: validOrders.length,
        error: 'Eşleşen ürünlü sipariş bulunamadı.',
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    if (!lastSyncedAt) {
      // First sync: replace all webhook entries with fresh data
      await tx.notificationEntry.deleteMany({
        where: { merchantId: user.merchantId, source: 'webhook' },
      });
    }

    for (const entry of newEntries) {
      await tx.notificationEntry.create({ data: entry });
    }

    // Prune oldest webhook entries if total exceeds limit
    const totalWebhook = await tx.notificationEntry.count({
      where: { merchantId: user.merchantId, source: 'webhook' },
    });

    if (totalWebhook > maxNotifications) {
      const toDelete = await tx.notificationEntry.findMany({
        where: { merchantId: user.merchantId, source: 'webhook' },
        orderBy: { purchaseDate: 'asc' },
        take: totalWebhook - maxNotifications,
        select: { id: true },
      });
      if (toDelete.length > 0) {
        await tx.notificationEntry.deleteMany({
          where: { id: { in: toDelete.map((e) => e.id) } },
        });
      }
    }

    await tx.storeSettings.update({
      where: { merchantId: user.merchantId },
      data: { lastSyncedAt: new Date() },
    });
  });

  return NextResponse.json({
    data: { synced: newEntries.length, ordersProcessed: validOrders.length },
  });
}
