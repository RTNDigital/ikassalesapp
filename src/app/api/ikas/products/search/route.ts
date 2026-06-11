import { getIkas } from '@/helpers/api-helpers';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { NextRequest, NextResponse } from 'next/server';

export type ProductSearchItem = {
  id: string;
  name: string;
  image: string | null;
};

export type ProductSearchApiResponse = {
  products: ProductSearchItem[];
};

/**
 * GET /api/ikas/products/search?q=...
 *
 * Proxies product search to the ikas GraphQL API.
 * - Authenticates the user from the request JWT.
 * - Accepts an optional `q` query parameter for search text.
 * - Returns a simplified list of products with id, name, and first image.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authToken = await AuthTokenManager.get(user.authorizedAppId);
    if (!authToken) {
      return NextResponse.json(
        { error: { statusCode: 404, message: 'Auth token not found' } },
        { status: 404 },
      );
    }

    const searchQuery = request.nextUrl.searchParams.get('q') || '';

    const ikasClient = getIkas(authToken);
    const response = await ikasClient.queries.listProduct({
      search: searchQuery || undefined,
      pagination: { limit: 20, page: 1 },
    });

    if (response.isSuccess && response.data?.listProduct) {
      const products: ProductSearchItem[] = response.data.listProduct.data.map((product) => {
        // Find the first main image across all variants, falling back to the first image
        let image: string | null = null;
        for (const variant of product.variants) {
          if (!variant.images?.length) continue;
          const mainImage = variant.images.find((img) => img.isMain);
          const selectedImage = mainImage || variant.images[0];
          if (selectedImage?.fileName) {
            image = selectedImage.fileName;
            break;
          }
        }

        return {
          id: product.id,
          name: product.name,
          image,
        };
      });

      return NextResponse.json({ data: { products } });
    }

    return NextResponse.json(
      { error: { statusCode: 500, message: 'Failed to fetch products' } },
      { status: 500 },
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: { statusCode: 500, message: 'Failed to search products' } },
      { status: 500 },
    );
  }
}
