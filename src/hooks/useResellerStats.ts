import { useState, useEffect } from 'react';
import { resellerApi, type ResellerDashboardStats } from '../api';

export function useResellerStats(): {
  data: ResellerDashboardStats | null;
  loading: boolean;
  error: string | null;
  isReseller: boolean;
} {
  const [data, setData] = useState<ResellerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReseller, setIsReseller] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    resellerApi
      .getUsage()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsReseller(true);
        }
      })
      .catch((e: { response?: { status?: number } }) => {
        if (!cancelled) {
          setIsReseller(e?.response?.status !== 403);
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error, isReseller };
}
