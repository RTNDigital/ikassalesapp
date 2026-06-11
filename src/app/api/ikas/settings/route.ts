import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';

export type SettingsApiResponse = {
  settings: any;
};

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let settings = await prisma.storeSettings.findUnique({
    where: { merchantId: user.merchantId },
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: { merchantId: user.merchantId },
    });
  }

  return NextResponse.json({ data: { settings } });
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Only allow updating known fields
  const allowedFields = [
    'isActive', 'showOnMobile', 'position', 'displayDuration', 'delayBetween',
    'firstDelay', 'maxPerPage', 'messageTemplate', 'timeTemplate', 'dataMode',
    'autoSyncOrders', 'syncOrderCount', 'animation', 'theme', 'customColors',
    'customFonts', 'showTeaser', 'teaserText', 'teaserBehavior', 'pageTargeting',
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      // JSON fields need to be stringified
      if (['customColors', 'customFonts', 'pageTargeting'].includes(key) && typeof body[key] === 'object') {
        updateData[key] = JSON.stringify(body[key]);
      } else {
        updateData[key] = body[key];
      }
    }
  }

  const settings = await prisma.storeSettings.upsert({
    where: { merchantId: user.merchantId },
    create: { merchantId: user.merchantId, ...updateData },
    update: updateData,
  });

  return NextResponse.json({ data: { settings } });
}
