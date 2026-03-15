import { useState, useEffect } from 'react';
import { userApi, type ReferralStats } from '../api';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let cache: { data: ReferralStats | null; error: string | null; ts: number } | null = null;

export function useReferralStats(): {
  data: ReferralStats | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<ReferralStats | null>(() => cache && Date.now() - cache.ts < CACHE_TTL_MS ? cache.data : null);
  const [loading, setLoading] = useState(() => !(cache && Date.now() - cache.ts < CACHE_TTL_MS));
  const [error, setError] = useState<string | null>(() => cache && Date.now() - cache.ts < CACHE_TTL_MS ? cache.error : null);

  useEffect(() => {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL_MS) {
      setData(cache.data);
      setError(cache.error);
      setLoading(false);
      userApi.getReferralStats().then((res) => { cache = { data: res, error: null, ts: Date.now() }; setData(res); setError(null); }).catch(() => {});
      return;
    }
    let cancelled = false;
    setLoading(true);
    userApi
      .getReferralStats()
      .then((res) => {
        if (!cancelled) {
          cache = { data: res, error: null, ts: Date.now() };
          setData(res);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const err = e instanceof Error ? e.message : 'Failed to load';
          cache = { data: null, error: err, ts: Date.now() };
          setError(err);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
