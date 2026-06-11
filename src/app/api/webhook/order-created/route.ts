import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhook/order-created
 *
 * Receives ikas `store/order/created` webhook events.
 * Validates the HMAC-SHA256 signature, extracts order data,
 * and creates NotificationEntry records for each line item.
 *
 * This endpoint is PUBLIC — ikas sends webhooks directly.
 * Authentication is via HMAC signature verification.
 */
export async function POST(request: NextRequest) {
  const clientSecret = process.env.CLIENT_SECRET;
  if (!clientSecret) {
    console.error('[webhook/order-created] CLIENT_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // 1. Read raw body as text for signature verification
  const rawBody = await request.text();

  // 2. Get signature from header (check both common header names)
  const signature =
    request.headers.get('x-ikas-signature') ??
    request.headers.get('x-ikas-hmac-sha256');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
  }

  // 3. Validate HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  );

  if (!isValid) {
    console.warn('[webhook/order-created] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 5. Parse the JSON payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Log payload in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[webhook/order-created] Payload:', JSON.stringify(payload, null, 2));
  }

  // 6. Extract merchantId from payload
  const merchantId = (payload.merchantId ?? payload.merchant_id ?? (payload.store as Record<string, unknown>)?.merchantId) as string | undefined;
  if (!merchantId) {
    console.warn('[webhook/order-created] No merchantId found in payload');
    return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 });
  }

  // 7. Check store settings — only process if dataMode includes real-time data
  const settings = await prisma.storeSettings.findUnique({
    where: { merchantId },
  });

  if (!settings) {
    // Store not registered yet, acknowledge webhook but skip processing
    return NextResponse.json({ status: 'ok', skipped: true, reason: 'store not found' });
  }

  const dataMode = settings.dataMode;
  if (dataMode !== 'real' && dataMode !== 'both') {
    // Store is set to manual-only mode, no webhook processing needed
    return NextResponse.json({ status: 'ok', skipped: true, reason: 'dataMode is manual' });
  }

  // 8. Extract order data with defensive optional chaining
  const order = (payload.order ?? payload.data ?? payload) as Record<string, unknown>;

  const shippingAddress = order.shippingAddress as Record<string, unknown> | undefined;
  const billingAddress = order.billingAddress as Record<string, unknown> | undefined;

  const customerName =
    (shippingAddress?.firstName as string) ??
    (shippingAddress?.name as string) ??
    (billingAddress?.firstName as string) ??
    (billingAddress?.name as string) ??
    (order.customerFirstName as string) ??
    'Müşteri';

  const location =
    (shippingAddress?.city as string) ??
    (billingAddress?.city as string) ??
    (shippingAddress?.state as string) ??
    '';

  const lineItems = (order.orderLineItems ?? order.lineItems ?? order.items ?? []) as Array<Record<string, unknown>>;
  const purchaseDate = order.createdAt ? new Date(order.createdAt as string) : new Date();

  if (lineItems.length === 0) {
    // No line items to process, but acknowledge the webhook
    return NextResponse.json({ status: 'ok', skipped: true, reason: 'no line items' });
  }

  // 9. Create NotificationEntry for each line item
  const createdEntries = await prisma.$transaction(
    lineItems.map((item) =>
      prisma.notificationEntry.create({
        data: {
          merchantId,
          source: 'webhook',
          customerName,
          location,
          productId: (item.productId as string) ?? null,
          productName: (item.productName as string) ?? (item.name as string) ?? 'Ürün',
          productImage: (item.thumbnailImage as string) ?? (item.image as string) ?? null,
          productHref: (item.productHref as string) ?? (item.href as string) ?? null,
          purchaseDate,
          isPrioritized: false,
          isActive: true,
        },
      }),
    ),
  );

  // 10. Prune old webhook entries if count exceeds syncOrderCount
  const maxEntries = settings.syncOrderCount || 50;
  const webhookCount = await prisma.notificationEntry.count({
    where: { merchantId, source: 'webhook' },
  });

  if (webhookCount > maxEntries) {
    const entriesToDelete = await prisma.notificationEntry.findMany({
      where: { merchantId, source: 'webhook' },
      orderBy: { createdAt: 'asc' },
      take: webhookCount - maxEntries,
      select: { id: true },
    });

    if (entriesToDelete.length > 0) {
      await prisma.notificationEntry.deleteMany({
        where: { id: { in: entriesToDelete.map((e) => e.id) } },
      });
    }
  }

  // 11. Return 200
  return NextResponse.json({
    status: 'ok',
    created: createdEntries.length,
  });
}
