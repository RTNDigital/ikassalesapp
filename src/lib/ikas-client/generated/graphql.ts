import { BaseGraphQLAPIClient, BaseGraphQLAPIClientOptions, APIResult } from '@ikas/admin-api-client';

export type OrderStatusEnum = string;

export enum StorefrontJSScriptContentTypeEnum {
  FILE = "FILE",
  SCRIPT = "SCRIPT"
}

export type CreateStorefrontJSScriptInput = {
  contentType: StorefrontJSScriptContentTypeEnum;
  fileName?: string;
  isHighPriority?: boolean;
  name: string;
  scriptContent: string;
  storefrontId: string;
}

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

export type ListStorefrontQueryVariables = {}

export type ListStorefrontQueryData = Array<{
  id: string;
}>

export interface ListStorefrontQuery {
  listStorefront: ListStorefrontQueryData;
}

export type CreateStorefrontJSScriptMutationVariables = {
  input: CreateStorefrontJSScriptInput;
}

export type CreateStorefrontJSScriptMutationData = {
  id: string;
  name: string;
}

export interface CreateStorefrontJSScriptMutation {
  createStorefrontJSScript: CreateStorefrontJSScriptMutationData;
}

export type ListOrderQueryVariables = {
  pagination?: PaginationInput;
  sort?: string;
}

export type ListOrderQueryData = {
  data: Array<{
  id: string;
  status: OrderStatusEnum;
  createdAt?: number;
  shippingAddress?: {
  firstName: string;
  city: {
  name: string;
};
};
  billingAddress?: {
  firstName: string;
  city: {
  name: string;
};
};
  orderLineItems: Array<{
  variant: {
  productId?: string;
};
}>;
}>;
}

export interface ListOrderQuery {
  listOrder: ListOrderQueryData;
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

  async listStorefront(): Promise<APIResult<Partial<ListStorefrontQuery>>> {
    const query = `
  query listStorefront {
    listStorefront {
      id
    }
  }
`;
    return this.client.query<Partial<ListStorefrontQuery>>({ query });
  }

  async listOrder(variables: ListOrderQueryVariables): Promise<APIResult<Partial<ListOrderQuery>>> {
    const query = `
  query listOrder($pagination: PaginationInput, $sort: String) {
    listOrder(pagination: $pagination, sort: $sort) {
      data {
        id
        status
        createdAt
        shippingAddress {
          firstName
          city {
            name
          }
        }
        billingAddress {
          firstName
          city {
            name
          }
        }
        orderLineItems {
          variant {
            productId
          }
        }
      }
    }
  }
`;
    return this.client.query<Partial<ListOrderQuery>>({ query, variables });
  }
}

export class GeneratedMutations {
  client: BaseGraphQLAPIClient<any>;

  constructor(client: BaseGraphQLAPIClient<any>) {
    this.client = client;
  }

  async createStorefrontJSScript(variables: CreateStorefrontJSScriptMutationVariables): Promise<APIResult<Partial<CreateStorefrontJSScriptMutation>>> {
    const mutation = `
  mutation createStorefrontJSScript($input: CreateStorefrontJSScriptInput!) {
    createStorefrontJSScript(input: $input) {
      id
      name
    }
  }
`;
    return this.client.mutate<Partial<CreateStorefrontJSScriptMutation>>({ mutation, variables });
  }
}

export class ikasAdminGraphQLAPIClient<TokenData> extends BaseGraphQLAPIClient<TokenData> {
  queries: GeneratedQueries;
  mutations: GeneratedMutations;

  constructor(options: BaseGraphQLAPIClientOptions<TokenData>) {
    super(options);
    this.queries = new GeneratedQueries(this);
    this.mutations = new GeneratedMutations(this);
  }
}
