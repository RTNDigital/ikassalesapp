import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';

export type SyncOrdersApiResponse = {
  synced: number;
  ordersProcessed: number;
};

const EXCLUDED_STATUSES = ['CANCELLED', 'PARTIALLY_CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DRAFT'];

async function gql(url: string, token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });

  const settings = await prisma.storeSettings.findUnique({ where: { merchantId: user.merchantId } });
  const maxNotifications = settings?.syncOrderCount ?? 20;

  const graphApiUrl = process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://api.myikas.com/api/v2/admin/graphql';
  const accessToken = authToken.accessToken;

  // 1. Fetch recent orders — sorted newest first
  let orders: any[] = [];
  try {
    const data = await gql(graphApiUrl, accessToken, `
      query ListOrder($pagination: PaginationInput, $sort: String) {
        listOrder(pagination: $pagination, sort: $sort) {
          data {
            id status createdAt
            shippingAddress { firstName city { name } }
            billingAddress { firstName city { name } }
            orderLineItems {
              variant { productId }
            }
          }
        }
      }
    `, { pagination: { limit: 100, page: 1 }, sort: '-createdAt' });
    orders = data?.listOrder?.data ?? [];
  } catch (error) {
    console.error('[sync-orders] Failed to fetch orders:', error);
    // Fallback: try without sort
    try {
      const data = await gql(graphApiUrl, accessToken, `
        query ListOrder($pagination: PaginationInput) {
          listOrder(pagination: $pagination) {
            data {
              id status createdAt
              shippingAddress { firstName city { name } }
              billingAddress { firstName city { name } }
              orderLineItems {
                variant { productId }
              }
            }
          }
        }
      `, { pagination: { limit: 100, page: 1 } });
      orders = data?.listOrder?.data ?? [];
      // Sort client-side
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e2) {
      console.error('[sync-orders] Fallback also failed:', e2);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 502 });
    }
  }

  // 2. Collect unique productIds from valid orders
  const productIds = new Set<string>();
  const validOrders = orders.filter((o: any) => !o.status || !EXCLUDED_STATUSES.includes(o.status));

  for (const order of validOrders) {
    for (const item of order.orderLineItems ?? []) {
      if (item.variant?.productId) productIds.add(item.variant.productId);
    }
  }

  // 3. Fetch product details (name, slug, image) — these are the REAL current product names
  const productMap = new Map<string, { name: string; slug: string; imageId: string | null }>();
  for (const pid of productIds) {
    try {
      const data = await gql(graphApiUrl, accessToken, `
        query ListProduct($id: StringFilterInput) {
          listProduct(id: $id, pagination: { limit: 1, page: 1 }) {
            data {
              id name
              metaData { slug }
              variants { images { imageId isMain } }
            }
          }
        }
      `, { id: { eq: pid } });

      for (const p of data?.listProduct?.data ?? []) {
        if (!p.name) continue;
        let imageId: string | null = null;
        for (const v of p.variants ?? []) {
          const mainImg = (v.images ?? []).find((i: any) => i.isMain);
          if (mainImg?.imageId) { imageId = mainImg.imageId; break; }
        }
        productMap.set(p.id, {
          name: p.name,
          slug: p.metaData?.slug || '',
          imageId,
        });
      }
    } catch {
      // Product not found = deleted/inactive, skip
    }
  }

  // 4. Delete old webhook entries
  await prisma.notificationEntry.deleteMany({
    where: { merchantId: user.merchantId, source: 'webhook' },
  });

  // 5. Create notifications — one per unique product per order, using PRODUCT name (not variant)
  let synced = 0;
  const seenProducts = new Set<string>();

  for (const order of validOrders) {
    if (synced >= maxNotifications) break;

    const customerName =
      order.shippingAddress?.firstName ??
      order.billingAddress?.firstName ??
      'Müşteri';

    const location =
      order.shippingAddress?.city?.name ??
      order.billingAddress?.city?.name ??
      '';

    for (const item of order.orderLineItems ?? []) {
      if (synced >= maxNotifications) break;

      const pid = item.variant?.productId;
      if (!pid) continue;

      // Skip duplicate products across orders
      const dedupKey = `${customerName}-${pid}`;
      if (seenProducts.has(dedupKey)) continue;
      seenProducts.add(dedupKey);

      const product = productMap.get(pid);
      if (!product) continue; // Product deleted/inactive

      const imageUrl = product.imageId
        ? `https://cdn.myikas.com/images/${user.merchantId}/${product.imageId}/180/${product.imageId}.webp`
        : null;

      await prisma.notificationEntry.create({
        data: {
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
        },
      });

      synced++;
    }
  }

  return NextResponse.json({
    data: { synced, ordersProcessed: validOrders.length },
  });
}
