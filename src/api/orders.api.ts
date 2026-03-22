import { api } from './client';
import type { Order, PagedList } from './types';

/** Unwrap GET /orders: backend may return `{ orders, total, page, pageSize }`, a raw array, or `{ data: ... }`. */
export function normalizePagedOrdersResponse<T>(raw: unknown, defaultPageSize: number): PagedList<T> {
  const empty = (): PagedList<T> => ({
    orders: [],
    total: 0,
    page: 1,
    pageSize: defaultPageSize,
  });
  if (raw == null) return empty();
  if (Array.isArray(raw)) {
    const list = raw as T[];
    return { orders: list, total: list.length, page: 1, pageSize: defaultPageSize };
  }
  if (typeof raw !== 'object') return empty();
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d.orders)) {
    const orders = d.orders as T[];
    return {
      orders,
      total: typeof d.total === 'number' ? d.total : orders.length,
      page: typeof d.page === 'number' ? d.page : 1,
      pageSize: typeof d.pageSize === 'number' ? d.pageSize : defaultPageSize,
    };
  }
  const nested = d.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested) && Array.isArray((nested as { orders?: unknown }).orders)) {
    const inner = nested as { orders: T[]; total?: number; page?: number; pageSize?: number };
    return {
      orders: inner.orders,
      total: typeof inner.total === 'number' ? inner.total : inner.orders.length,
      page: typeof inner.page === 'number' ? inner.page : 1,
      pageSize: typeof inner.pageSize === 'number' ? inner.pageSize : defaultPageSize,
    };
  }
  if (Array.isArray(nested)) {
    const list = nested as T[];
    return { orders: list, total: list.length, page: 1, pageSize: defaultPageSize };
  }
  return empty();
}

export interface CreateOrderBody {
  serviceType: number | string;
  productId: number;
  quantity: number;
  price: number;
  targets?: string[];
  modificatorsSelection?: Record<string, number>;
  promoCode?: string;
}

export interface SubCredentialRow {
  id: number;
  proxyId: string;
  credentialsString: string | null;
  createdAt: string;
  usedDataBytes: number;
  isActive: boolean;
  expiredAt: string | null;
}

export interface SubCredentialsResponse {
  success: boolean;
  data: SubCredentialRow[];
  limit: number;
  formattedLines?: string[];
}

export const ordersApi = {
  /** GET /orders — пагинация на бэкенде; по умолчанию page=1, pageSize=500. */
  getOrders: async (opts?: { page?: number; pageSize?: number }): Promise<PagedList<Order>> => {
    const pageSize = opts?.pageSize ?? 500;
    const res = await api.get<unknown>('/orders', {
      params: { page: opts?.page ?? 1, pageSize },
    });
    return normalizePagedOrdersResponse<Order>(res.data, pageSize);
  },

  getSubCredentials: async (orderId: number): Promise<SubCredentialsResponse> => {
    const res = await api.get<SubCredentialsResponse>(`/orders/${orderId}/sub-credentials`);
    return res.data ?? { success: false, data: [], limit: 0 };
  },

  generateSubCredentials: async (
    orderId: number,
    count: number
  ): Promise<{ success: boolean; credentials: string[] }> => {
    const res = await api.post<{ success: boolean; credentials: string[] }>(
      `/orders/${orderId}/sub-credentials/generate`,
      { count }
    );
    return res.data ?? { success: false, credentials: [] };
  },

  /** Apply settings / save list: updates visible sub-credentials; shorter list hides the rest. */
  applySubCredentialsSettings: async (
    orderId: number,
    credentials: string[]
  ): Promise<{ success: boolean }> => {
    const res = await api.post<{ success: boolean }>(
      `/orders/${orderId}/sub-credentials/apply-settings`,
      { credentials }
    );
    return res.data ?? { success: false };
  },

  updateOrder: async (
    orderId: number,
    data: { autoRefill?: boolean; autoRefillAmountGb?: number | null }
  ): Promise<Order> => {
    const res = await api.put<Order>(`/orders/${orderId}`, data);
    return res.data;
  },

  createOrder: async (body: CreateOrderBody): Promise<Order> => {
    const res = await api.post<Order>('/add', {
      serviceType: body.serviceType,
      productId: body.productId,
      quantity: body.quantity,
      price: body.price,
      targets: body.targets ?? [],
      ...(body.modificatorsSelection && { modificatorsSelection: body.modificatorsSelection }),
      ...(body.promoCode && { promoCode: body.promoCode }),
    });
    return res.data;
  },
};
