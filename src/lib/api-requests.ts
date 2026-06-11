import axios from 'axios';
import { GetMerchantApiResponse } from '../app/api/ikas/get-merchant/route';
import { ApiResponseType } from '../globals/constants';

export async function makePostRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.post<ApiResponseType<T>>(url, data, {
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makeGetRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.get<ApiResponseType<T>>(url, {
    params: data,
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makeDeleteRequest<T>({ url, token }: { url: string; token?: string }) {
  return axios.delete<ApiResponseType<T>>(url, {
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

// API requests object - frontend-backend bridge
export const ApiRequests = {
  ikas: {
    getMerchant: (token: string) => makeGetRequest<GetMerchantApiResponse>({ url: '/api/ikas/get-merchant', token }),
  },
  settings: {
    get: (token: string) => makeGetRequest<{ settings: any }>({ url: '/api/ikas/settings', token }),
    update: (token: string, data: any) => makePostRequest<{ settings: any }>({ url: '/api/ikas/settings', data, token }),
  },
  notifications: {
    list: (token: string, source?: string) =>
      makeGetRequest<{ notifications: any[] }>({ url: '/api/ikas/notifications', token, data: source ? { source } : undefined }),
    create: (token: string, data: any) =>
      makePostRequest<{ notification: any }>({ url: '/api/ikas/notifications', data, token }),
    update: (token: string, id: string, data: any) =>
      makePostRequest<{ notification: any }>({ url: `/api/ikas/notifications/${id}`, data, token }),
    remove: (token: string, id: string) =>
      makeDeleteRequest<void>({ url: `/api/ikas/notifications/${id}`, token }),
  },
  analytics: {
    get: (token: string, days?: number) =>
      makeGetRequest<any>({ url: '/api/analytics', token, data: { days: days || 7 } }),
  },
};
