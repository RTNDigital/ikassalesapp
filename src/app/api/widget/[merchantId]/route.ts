import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  const { merchantId } = await params;

  const settings = await prisma.storeSettings.findUnique({
    where: { merchantId },
  });

  // If no settings or widget is disabled, return inactive response
  if (!settings || !settings.isActive) {
    return NextResponse.json(
      { settings: { isActive: false }, notifications: [] },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      },
    );
  }

  const notifications = await prisma.notificationEntry.findMany({
    where: {
      merchantId,
      isActive: true,
    },
    select: {
      id: true,
      customerName: true,
      location: true,
      productName: true,
      productImage: true,
      productHref: true,
      purchaseDate: true,
      isPrioritized: true,
    },
    orderBy: [
      { isPrioritized: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Parse JSON fields before returning
  const parsedSettings = {
    isActive: settings.isActive,
    showOnMobile: settings.showOnMobile,
    position: settings.position,
    displayDuration: settings.displayDuration,
    delayBetween: settings.delayBetween,
    firstDelay: settings.firstDelay,
    maxPerPage: settings.maxPerPage,
    messageTemplate: settings.messageTemplate,
    timeTemplate: settings.timeTemplate,
    animation: settings.animation,
    theme: settings.theme,
    customColors: JSON.parse(settings.customColors),
    customFonts: JSON.parse(settings.customFonts),
    showTeaser: settings.showTeaser,
    teaserText: settings.teaserText,
    teaserBehavior: settings.teaserBehavior,
    pageTargeting: JSON.parse(settings.pageTargeting),
  };

  return NextResponse.json(
    { settings: parsedSettings, notifications },
    {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    },
  );
}
