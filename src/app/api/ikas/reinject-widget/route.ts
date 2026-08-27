import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { config } from '@/globals/config';

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });

  const deployUrl = process.env.NEXT_PUBLIC_DEPLOY_URL || 'https://app-name-sales-notifications.vercel.app';
  const scriptContent = `<script src="${deployUrl}/widget.js?mid=${user.merchantId}" defer></script>`;

  const sfRes = await fetch(config.graphApiUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.accessToken}` },
    body: JSON.stringify({ query: '{ listStorefront { id } }' }),
  });
  const sfData = await sfRes.json();

  if (sfData.errors) {
    return NextResponse.json({ error: 'Failed to list storefronts', details: sfData.errors }, { status: 502 });
  }

  const storefronts = sfData?.data?.listStorefront || [];
  if (storefronts.length === 0) {
    return NextResponse.json({ error: 'No storefronts found' }, { status: 404 });
  }

  const results: { storefrontId: string; success: boolean; error?: string }[] = [];

  for (const sf of storefronts) {
    const scriptRes = await fetch(config.graphApiUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.accessToken}` },
      body: JSON.stringify({
        query: `mutation CreateStorefrontJSScript($input: CreateStorefrontJSScriptInput!) {
          createStorefrontJSScript(input: $input) { id name }
        }`,
        variables: {
          input: {
            name: 'Sales Notifications Widget',
            contentType: 'SCRIPT',
            scriptContent,
            storefrontId: sf.id,
            isHighPriority: false,
          },
        },
      }),
    });
    const scriptData = await scriptRes.json();

    if (scriptData.errors) {
      results.push({ storefrontId: sf.id, success: false, error: scriptData.errors[0]?.message });
    } else {
      results.push({ storefrontId: sf.id, success: true });
    }
  }

  const allSuccess = results.every((r) => r.success);
  return NextResponse.json({
    data: { success: allSuccess, storefronts: results },
  });
}
