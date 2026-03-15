import { api } from './client';
import type { ProxyCheckResponse, ProxyCheckBatchResponse } from './types';

export const proxiesApi = {
  getCheckUsage: async (): Promise<{ used: number; limit: number }> => {
    const res = await api.get<{ used: number; limit: number }>('/proxies/check-usage');
    return res.data ?? { used: 0, limit: 500 };
  },

  checkProxyIp: async (connectionString: string, protocol?: 'http' | 'socks4' | 'socks5'): Promise<ProxyCheckResponse> => {
    const res = await api.post<ProxyCheckResponse>('/proxies/check-ip', {
      connectionString,
      ...(protocol && { protocol }),
    });
    return res.data ?? { success: false, message: 'No response' };
  },

  checkProxyIpBatch: async (
    connectionStrings: string[],
    protocol?: 'http' | 'socks4' | 'socks5'
  ): Promise<ProxyCheckBatchResponse> => {
    const res = await api.post<ProxyCheckBatchResponse>('/proxies/check-ip', {
      connectionStrings,
      ...(protocol && { protocol }),
    });
    return res.data ?? { success: false, message: 'No response' };
  },
};
