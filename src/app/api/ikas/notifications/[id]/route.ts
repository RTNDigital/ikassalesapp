import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';

export type NotificationUpdateApiResponse = {
  notification: any;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Check existence with merchantId scoping for security
  const existing = await prisma.notificationEntry.findFirst({
    where: { id, merchantId: user.merchantId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  // Only allow updating known fields
  const allowedFields = [
    'customerName', 'location', 'productId', 'productName',
    'productImage', 'productHref', 'purchaseDate', 'isPrioritized', 'isActive',
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      if (key === 'purchaseDate') {
        updateData[key] = new Date(body[key]);
      } else {
        updateData[key] = body[key];
      }
    }
  }

  const notification = await prisma.notificationEntry.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ data: { notification } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Check existence with merchantId scoping for security
  const existing = await prisma.notificationEntry.findFirst({
    where: { id, merchantId: user.merchantId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  await prisma.notificationEntry.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
