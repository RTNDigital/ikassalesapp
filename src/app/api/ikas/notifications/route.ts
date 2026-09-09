import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';

export type NotificationsListApiResponse = {
  notifications: any[];
};

export type NotificationCreateApiResponse = {
  notification: any;
};

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const source = request.nextUrl.searchParams.get('source');

  const where: Record<string, any> = { merchantId: user.merchantId };
  if (source === 'manual' || source === 'webhook') {
    where.source = source;
  }

  const notifications = await prisma.notificationEntry.findMany({
    where,
    orderBy: [
      { isPrioritized: 'desc' },
      { purchaseDate: 'desc' },
    ],
  });

  return NextResponse.json({ data: { notifications } });
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Validate required fields
  if (!body.customerName || !body.productName) {
    return NextResponse.json(
      { error: 'customerName and productName are required' },
      { status: 400 },
    );
  }

  const notification = await prisma.notificationEntry.create({
    data: {
      merchantId: user.merchantId,
      source: 'manual',
      customerName: body.customerName,
      productName: body.productName,
      location: body.location ?? '',
      productId: body.productId ?? null,
      productImage: body.productImage ?? null,
      productHref: body.productHref ?? null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      isPrioritized: body.isPrioritized ?? false,
      isActive: true,
    },
  });

  return NextResponse.json({ data: { notification } }, { status: 201 });
}
