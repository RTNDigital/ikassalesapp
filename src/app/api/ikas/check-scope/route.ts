import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { config } from '@/globals/config';

const REQUIRED_SCOPES = config.oauth.scope.split(',');

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });

  const currentScopes = authToken.scope?.split(',') || [];
  const missingScopes = REQUIRED_SCOPES.filter((s) => !currentScopes.includes(s));

  if (missingScopes.length === 0) {
    return NextResponse.json({ data: { needsReauth: false } });
  }

  const ikasClient = getIkas(authToken);
  const merchantResponse = await ikasClient.queries.getMerchant();
  const storeName = merchantResponse.data?.getMerchant?.storeName;

  if (!storeName) {
    return NextResponse.json({ error: 'Could not determine store name' }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      needsReauth: true,
      missingScopes,
      storeName,
    },
  });
}
