import { gql } from 'graphql-request';

export const GET_MERCHANT = gql`
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;

export const GET_AUTHORIZED_APP = gql`
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;

export const LIST_PRODUCT = gql`
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

export const LIST_STOREFRONT = gql`
  query listStorefront {
    listStorefront {
      id
    }
  }
`;

export const CREATE_STOREFRONT_JS_SCRIPT = gql`
  mutation createStorefrontJSScript($input: CreateStorefrontJSScriptInput!) {
    createStorefrontJSScript(input: $input) {
      id
      name
    }
  }
`;

export const LIST_ORDER = gql`
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
