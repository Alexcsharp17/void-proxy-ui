import { api } from './client';

export interface AvailableRegionsResponse {
  regions: string[];
  regionsWithCities: { region: string; name?: string; cities: string[] }[];
  lastUpdated?: string;
}

/** GET /public/available-regions — тот же источник, что и legacy UI (OrderDetailsModal). */
export const publicApi = {
  getAvailableRegions: async (): Promise<AvailableRegionsResponse> => {
    const res = await api.get<AvailableRegionsResponse>('/public/available-regions');
    return res.data ?? { regions: [], regionsWithCities: [] };
  },
};
