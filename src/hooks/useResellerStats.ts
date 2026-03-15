import { useState, useEffect } from 'react';
import { resellerApi, type ResellerDashboardStats } from '../api';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let cache: { data: ResellerDashboardStats | null; isReseller: boolean; error: string | null; ts: number } | null = null;

export function useResellerStats(): {
  data: ResellerDashboardStats | null;
  loading: boolean;
  error: string | null;
  isReseller: boolean;
} {
  const fromCache = cache && Date.now() - cache.ts < CACHE_TTL_MS;
  const [data, setData] = useState<ResellerDashboardStats | null>(() => fromCache ? cache!.data : null);
  const [loading, setLoading] = useState(!fromCache);
  const [error, setError] = useState<string | null>(() => fromCache ? cache!.error : null);
  const [isReseller, setIsReseller] = useState(() => fromCache ? cache!.isReseller : false);

  useEffect(() => {
    if (fromCache) {
      setLoading(false);
      resellerApi.getUsage().then((res) => {
        cache = { data: res, isReseller: true, error: null, ts: Date.now() };
        setData(res);
        setIsReseller(true);
        setError(null);
      }).catch(() => { /* keep cached state on background refetch failure */ });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    resellerApi
      .getUsage()
      .then((res) => {
        if (!cancelled) {
          cache = { data: res, isReseller: true, error: null, ts: Date.now() };
          setData(res);
          setIsReseller(true);
        }
      })
      .catch((e: { response?: { status?: number } }) => {
        if (!cancelled) {
          const isRes = e?.response?.status !== 403;
          cache = { data: null, isReseller: isRes, error: e instanceof Error ? e.message : 'Failed to load', ts: Date.now() };
          setIsReseller(isRes);
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error, isReseller };
}
