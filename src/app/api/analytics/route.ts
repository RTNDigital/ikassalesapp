import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const VALID_EVENT_TYPES = ['impression', 'click'] as const;
const VALID_DEVICES = ['desktop', 'mobile'] as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/analytics — PUBLIC
 * Receives analytics events from the storefront widget (via sendBeacon).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400, headers: CORS_HEADERS });
  }

  const { merchantId, eventType, page, device, notificationEntryId } = body as {
    merchantId?: string;
    eventType?: string;
    page?: string;
    device?: string;
    notificationEntryId?: string;
  };

  // Validate required fields
  if (!merchantId || !eventType || !page || !device) {
    return NextResponse.json(
      { error: 'merchantId, eventType, page, and device are required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number])) {
    return NextResponse.json(
      { error: 'eventType must be "impression" or "click"' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!VALID_DEVICES.includes(device as typeof VALID_DEVICES[number])) {
    return NextResponse.json(
      { error: 'device must be "desktop" or "mobile"' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  await prisma.analyticsEvent.create({
    data: {
      merchantId,
      eventType,
      page,
      device,
      notificationEntryId: notificationEntryId as string | undefined,
    },
  });

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/analytics — AUTHENTICATED
 * Returns analytics summary for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '7', 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const merchantId = user.merchantId;

  // Fetch all events in the date range
  const events = await prisma.analyticsEvent.findMany({
    where: {
      merchantId,
      timestamp: { gte: since },
    },
    select: {
      eventType: true,
      device: true,
      timestamp: true,
      notificationEntryId: true,
    },
  });

  // Summary
  const totalImpressions = events.filter((e) => e.eventType === 'impression').length;
  const totalClicks = events.filter((e) => e.eventType === 'click').length;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Daily breakdown
  const dailyMap = new Map<string, { impressions: number; clicks: number }>();
  for (const event of events) {
    const dateKey = event.timestamp.toISOString().split('T')[0];
    const entry = dailyMap.get(dateKey) ?? { impressions: 0, clicks: 0 };
    if (event.eventType === 'impression') entry.impressions++;
    if (event.eventType === 'click') entry.clicks++;
    dailyMap.set(dateKey, entry);
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top products by clicks (top 10)
  const clicksByNotification = new Map<string, number>();
  for (const event of events) {
    if (event.eventType === 'click' && event.notificationEntryId) {
      clicksByNotification.set(
        event.notificationEntryId,
        (clicksByNotification.get(event.notificationEntryId) ?? 0) + 1,
      );
    }
  }

  const topNotificationIds = Array.from(clicksByNotification.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let topProducts: { productName: string; clicks: number }[] = [];
  if (topNotificationIds.length > 0) {
    const notificationEntries = await prisma.notificationEntry.findMany({
      where: {
        id: { in: topNotificationIds.map(([id]) => id) },
      },
      select: {
        id: true,
        productName: true,
      },
    });

    const nameMap = new Map(notificationEntries.map((n) => [n.id, n.productName]));
    topProducts = topNotificationIds.map(([id, clicks]) => ({
      productName: nameMap.get(id) ?? 'Unknown',
      clicks,
    }));
  }

  // Device split
  const desktopCount = events.filter((e) => e.device === 'desktop').length;
  const mobileCount = events.filter((e) => e.device === 'mobile').length;
  const totalDeviceEvents = desktopCount + mobileCount;

  const devices = {
    desktop: totalDeviceEvents > 0 ? Math.round((desktopCount / totalDeviceEvents) * 100) : 0,
    mobile: totalDeviceEvents > 0 ? Math.round((mobileCount / totalDeviceEvents) * 100) : 0,
  };

  return NextResponse.json({
    data: {
      summary: {
        totalImpressions,
        totalClicks,
        ctr: Math.round(ctr * 100) / 100,
      },
      daily,
      topProducts,
      devices,
    },
  });
}
