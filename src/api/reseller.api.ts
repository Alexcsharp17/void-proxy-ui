import { api } from './client';

export interface ResellerDashboardStats {
  totalOrders: number;
  totalClients: number;
  totalSpent: number;
  activeOrders: number;
  completedOrders: number;
  discountPercent: number;
  discountTiers: { minSpent: number; percent: number; label?: string }[];
  nextTierMinSpent?: number | null;
  currentTierLabel?: string;
}

export const resellerApi = {
  getUsage: async (): Promise<ResellerDashboardStats> => {
    const res = await api.get<ResellerDashboardStats>('/reseller/usage');
    return res.data ?? { totalOrders: 0, totalClients: 0, totalSpent: 0, activeOrders: 0, completedOrders: 0, discountPercent: 0, discountTiers: [] };
  },

  getIpWhitelist: async (): Promise<string[]> => {
    const res = await api.get<string[]>('/reseller/ip-whitelist');
    return Array.isArray(res.data) ? res.data : [];
  },

  updateIpWhitelist: async (ipAddresses: string[]): Promise<{ success: boolean; whitelist: string[] }> => {
    const res = await api.put<{ success: boolean; whitelist: string[] }>('/reseller/ip-whitelist', { ipAddresses });
    return res.data;
  },
};
