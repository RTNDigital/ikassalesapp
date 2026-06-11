import { BaseGraphQLAPIClient, BaseGraphQLAPIClientOptions, APIResult } from '@ikas/admin-api-client';

export type PaginationInput = {
  limit?: number;
  page?: number;
}

export type GetMerchantQueryVariables = {}

export type GetMerchantQueryData = {
  id: string;
  email: string;
  storeName?: string;
}

export interface GetMerchantQuery {
  getMerchant: GetMerchantQueryData;
}

export type GetAuthorizedAppQueryVariables = {}

export type GetAuthorizedAppQueryData = {
  id: string;
  salesChannelId?: string;
}

export interface GetAuthorizedAppQuery {
  getAuthorizedApp: GetAuthorizedAppQueryData;
}

export type ListProductQueryVariables = {
  search?: string;
  pagination?: PaginationInput;
}

export type ListProductQueryData = {
  data: Array<{
  id: string;
  name: string;
  metaData?: {
  slug: string;
};
  variants: Array<{
  images?: Array<{
  fileName?: string;
  imageId?: string;
  isMain: boolean;
  order: number;
}>;
}>;
}>;
}

export interface ListProductQuery {
  listProduct: ListProductQueryData;
}

export class GeneratedQueries {
  client: BaseGraphQLAPIClient<any>;

  constructor(client: BaseGraphQLAPIClient<any>) {
    this.client = client;
  }

  async getMerchant(): Promise<APIResult<Partial<GetMerchantQuery>>> {
    const query = `
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;
    return this.client.query<Partial<GetMerchantQuery>>({ query });
  }

  async getAuthorizedApp(): Promise<APIResult<Partial<GetAuthorizedAppQuery>>> {
    const query = `
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;
    return this.client.query<Partial<GetAuthorizedAppQuery>>({ query });
  }

  async listProduct(variables: ListProductQueryVariables): Promise<APIResult<Partial<ListProductQuery>>> {
    const query = `
  query listProduct($search: String, $pagination: PaginationInput) {
    listProduct(search: $search, pagination: $pagination) {
      data {
        id
        name
        metaData {
          slug
        }
        variants {
          images {
            fileName
            imageId
            isMain
            order
          }
        }
      }
    }
  }
`;
    return this.client.query<Partial<ListProductQuery>>({ query, variables });
  }
}

export class ikasAdminGraphQLAPIClient<TokenData> extends BaseGraphQLAPIClient<TokenData> {
  queries: GeneratedQueries;

  constructor(options: BaseGraphQLAPIClientOptions<TokenData>) {
    super(options);
    this.queries = new GeneratedQueries(this);
  }
}
