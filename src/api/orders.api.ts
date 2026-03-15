import { api } from './client';
import type { Order } from './types';

export interface SubCredentialRow {
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
  getOrders: async (): Promise<Order[]> => {
    const res = await api.get<Order[]>('/orders');
    return Array.isArray(res.data) ? res.data : [];
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

  updateOrder: async (
    orderId: number,
    data: { autoRefill?: boolean; autoRefillAmountGb?: number | null }
  ): Promise<Order> => {
    const res = await api.put<Order>(`/orders/${orderId}`, data);
    return res.data;
  },
};
