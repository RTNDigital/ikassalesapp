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
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  orderLineItems?: OrderLineItem[];
  createdAt?: string;
}

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

  // 5. Delete existing webhook entries for this merchant
  await prisma.notificationEntry.deleteMany({
    where: { merchantId: user.merchantId, source: 'webhook' },
  });

  // 6. Create new NotificationEntry records from fetched orders
  let synced = 0;

  for (const order of orders) {
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

    if (lineItems.length === 0) continue;

    await prisma.$transaction(
      lineItems.map((item) => {
        const v = item.variant;
        const imageUrl = v?.mainImageId
          ? `https://cdn.myikas.com/images/${user.merchantId}/${v.mainImageId}/180/${v.mainImageId}.webp`
          : null;
        return prisma.notificationEntry.create({
          data: {
            merchantId: user.merchantId,
            source: 'webhook',
            customerName,
            location,
            productId: v?.productId ?? null,
            productName: v?.name ?? 'Ürün',
            productImage: imageUrl,
            productHref: v?.slug ? `/${v.slug}` : null,
            purchaseDate,
            isPrioritized: false,
            isActive: true,
          },
        });
      }),
    );

    synced += lineItems.length;
  }

  // 7. Return sync results
  return NextResponse.json({
    data: {
      synced,
      ordersProcessed: orders.length,
    },
  });
}
