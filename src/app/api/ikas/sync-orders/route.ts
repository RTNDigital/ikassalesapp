import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';

interface OrderLineItemVariant {
  name?: string;
  productId?: string;
  mainImageId?: string;
  slug?: string;
}

interface OrderLineItem {
  variant?: OrderLineItemVariant;
}

interface OrderAddress {
  firstName?: string;
  city?: { name?: string };
}

interface Order {
  id: string;
  status?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  orderLineItems?: OrderLineItem[];
  createdAt?: string;
}

const EXCLUDED_STATUSES = ['CANCELLED', 'PARTIALLY_CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DRAFT'];

interface ListOrderResponse {
  data?: {
    listOrder?: {
      data?: Order[];
    };
  };
  errors?: Array<{ message: string }>;
}

export type SyncOrdersApiResponse = {
  synced: number;
  ordersProcessed: number;
};

/**
 * POST /api/ikas/sync-orders
 *
 * Manually syncs recent orders from ikas into NotificationEntry records.
 * Authenticated endpoint — requires JWT token.
 *
 * 1. Fetches recent orders via ikas GraphQL API
 * 2. Deletes existing webhook entries for the merchant
 * 3. Creates fresh NotificationEntry records from fetched orders
 */
export async function POST(request: Request) {
  // 1. Authenticate
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get auth token
  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) {
    return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });
  }

  // 3. Get store settings to determine syncOrderCount
  const settings = await prisma.storeSettings.findUnique({
    where: { merchantId: user.merchantId },
  });

  const syncOrderCount = settings?.syncOrderCount ?? 50;

  // 4. Fetch recent orders via raw GraphQL (avoids dependency on codegen for listOrder)
  const graphApiUrl = process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://api.myikas.com/api/v2/admin/graphql';

  let orders: Order[] = [];
  try {
    const response = await fetch(graphApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.accessToken}`,
      },
      body: JSON.stringify({
        query: `query ListOrder($pagination: PaginationInput) {
          listOrder(pagination: $pagination) {
            data {
              id
              status
              shippingAddress { firstName city { name } }
              billingAddress { firstName city { name } }
              orderLineItems {
                variant { name productId mainImageId slug }
              }
              createdAt
            }
          }
        }`,
        variables: {
          pagination: { limit: syncOrderCount, page: 1 },
        },
      }),
    });

    if (!response.ok) {
      console.error('[sync-orders] GraphQL request failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch orders from ikas' },
        { status: 502 },
      );
    }

    const result: ListOrderResponse = await response.json();

    if (result.errors?.length) {
      console.error('[sync-orders] GraphQL errors:', result.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: result.errors.map((e) => e.message) },
        { status: 502 },
      );
    }

    orders = result.data?.listOrder?.data ?? [];
  } catch (error) {
    console.error('[sync-orders] Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders from ikas' },
      { status: 502 },
    );
  }

  // 5. Collect unique productIds to fetch real slugs
  const productIds = new Set<string>();
  for (const order of orders) {
    if (order.status && EXCLUDED_STATUSES.includes(order.status)) continue;
    for (const item of order.orderLineItems ?? []) {
      if (item.variant?.productId) productIds.add(item.variant.productId);
    }
  }

  // 6. Fetch real product slugs from ikas (active products only)
  const slugMap = new Map<string, { slug: string; imageId: string | null }>();
  if (productIds.size > 0) {
    try {
      const prodRes = await fetch(graphApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.accessToken}` },
        body: JSON.stringify({
          query: `query ListProduct($pagination: PaginationInput) {
            listProduct(pagination: $pagination) {
              data { id metaData { slug } variants { images { imageId isMain } } }
            }
          }`,
          variables: { pagination: { limit: 200, page: 1 } },
        }),
      });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        for (const p of prodData?.data?.listProduct?.data ?? []) {
          if (!p.metaData?.slug) continue;
          let imageId: string | null = null;
          for (const v of p.variants ?? []) {
            const mainImg = (v.images ?? []).find((i: any) => i.isMain);
            if (mainImg?.imageId) { imageId = mainImg.imageId; break; }
          }
          slugMap.set(p.id, { slug: p.metaData.slug, imageId });
        }
      }
    } catch (e) {
      console.error('[sync-orders] Failed to fetch product slugs:', e);
    }
  }

  // 7. Delete existing webhook entries for this merchant
  await prisma.notificationEntry.deleteMany({
    where: { merchantId: user.merchantId, source: 'webhook' },
  });

  // 8. Create new NotificationEntry records from fetched orders
  let synced = 0;

  for (const order of orders) {
    if (order.status && EXCLUDED_STATUSES.includes(order.status)) continue;

    const customerName =
      order.shippingAddress?.firstName ??
      order.billingAddress?.firstName ??
      'Müşteri';

    const location =
      order.shippingAddress?.city?.name ??
      order.billingAddress?.city?.name ??
      '';

    const purchaseDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const lineItems = order.orderLineItems ?? [];

    const validItems = lineItems.filter((item) => item.variant?.name);

    if (validItems.length === 0) continue;

    await prisma.$transaction(
      validItems.map((item) => {
        const v = item.variant!;
        const productInfo = slugMap.get(v.productId!);
        const imageUrl = productInfo?.imageId
          ? `https://cdn.myikas.com/images/${user.merchantId}/${productInfo.imageId}/180/${productInfo.imageId}.webp`
          : null;
        return prisma.notificationEntry.create({
          data: {
            merchantId: user.merchantId,
            source: 'webhook',
            customerName,
            location,
            productId: v.productId ?? null,
            productName: v.name ?? 'Ürün',
            productImage: imageUrl,
            productHref: productInfo?.slug ? `/${productInfo.slug}` : null,
            purchaseDate,
            isPrioritized: false,
            isActive: true,
          },
        });
      }),
    );

    synced += validItems.length;
  }

  // 7. Return sync results
  return NextResponse.json({
    data: {
      synced,
      ordersProcessed: orders.length,
    },
  });
}
