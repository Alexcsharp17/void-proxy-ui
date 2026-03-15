import { useState, useEffect } from 'react';
import { userApi, type ReferralStats } from '../api';

export function useReferralStats(): {
  data: ReferralStats | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userApi
      .getReferralStats()
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
