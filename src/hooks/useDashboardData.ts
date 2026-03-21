import { useState, useEffect, useMemo, useCallback } from 'react';
import { ordersApi, userApi } from '../api';
import type { Order as ApiOrder } from '../api';
import { orderToDisplayOrder } from '../api/mappers/orders';
import type { DisplayOrderNoIcon } from '../api/mappers/orders';
import { toServiceType, toOrderStatus, ServiceType, OrderStatus } from '../enums/api';
import { useAuth } from '../contexts/AuthContext';

const BYTES_PER_GB = 1024 ** 3;
const DELETION_HOURS = 48;

export interface DashboardData {
  usage?: {
    percentage: number;
    total: string;
    used: string;
    left: string;
  };
  reselling?: unknown;
  affiliate?: unknown;
}

function computeUsageFromOrders(orders: ApiOrder[]): DashboardData['usage'] {
  const gbOrders = orders.filter((o) => {
    if (toServiceType(o.serviceType) !== ServiceType.Proxies) return false;
    const baseUnit = o.baseUnit ?? '';
    const displayUnit = o.displayUnit ?? '';
    if (baseUnit === 'second' && displayUnit === 'hour') return false;
    return true;
  });
  if (gbOrders.length === 0) {
    return { percentage: 0, total: '0', used: '0', left: '0' };
  }
  /** Normalize to bytes: API may return quantity in GB (e.g. 10) for GB proxy orders */
  const toBytes = (val: number, asGb: boolean) =>
    asGb && val > 0 && val < 1024 * 1024 * 1024 ? val * BYTES_PER_GB : val;

  let totalEffective = 0;
  let totalCompleted = 0;
  for (const o of gbOrders) {
    const q = Number(o.quantity) || 0;
    const rem = Number(o.quantityRemaining ?? 0);
    const comp = Number(o.completed) ?? 0;
    const isGb = (o.baseUnit ?? '') === 'byte' && /^gb$/i.test(o.displayUnit ?? '');
    const asGb = isGb && (q < 1024 * 1024 * 1024 || rem < 1024 * 1024 * 1024);
    const qB = toBytes(q, asGb);
    const remB = toBytes(rem, asGb);
    const compB = toBytes(comp, asGb && comp < 1024 * 1024 * 1024 && comp >= 0);
    totalEffective += Math.max(qB, remB);
    totalCompleted += compB;
  }
  const totalGb = totalEffective / BYTES_PER_GB;
  const usedGb = totalCompleted / BYTES_PER_GB;
  const remainingGb = Math.max(0, totalEffective - totalCompleted) / BYTES_PER_GB;
  const percentage = totalEffective > 0 ? Math.min(100, (totalCompleted / totalEffective) * 100) : 0;
  return {
    percentage,
    total: totalGb.toFixed(2),
    used: usedGb.toFixed(2),
    left: remainingGb.toFixed(2),
  };
}

export function useDashboardData(): {
  dashboardData: DashboardData | null;
  orders: DisplayOrderNoIcon[];
  balance: number | null;
  currency: string;
  loading: boolean;
  error: string | null;
  showDeletionBanner: boolean;
  deletionCountdown: string;
  /** Reload orders + balance (e.g. after purchase). Use `{ showLoading: false }` to avoid full-page skeleton. */
  refetch: (options?: { showLoading?: boolean }) => Promise<void>;
} {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletionCountdown, setDeletionCountdown] = useState('00:00:00');

  const load = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const showLoading = options?.showLoading !== false;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const [ordersRes, balanceRes] = await Promise.all([
          ordersApi.getOrders({ page: 1, pageSize: 500 }),
          userApi.getBalance().catch(() => ({ success: false, balance: 0, currency: 'USD' })),
        ]);
        const list = ordersRes?.orders ?? [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
        if (balanceRes?.success !== false) {
          setBalance(balanceRes.balance ?? 0);
          setCurrency(balanceRes.currency ?? 'USD');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  /** После curl / другого окна — обновить список при возврате на вкладку */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        void load({ showLoading: false });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, load]);

  const usage = useMemo(() => computeUsageFromOrders(orders), [orders]);

  const dashboardData: DashboardData | null = useMemo(
    () => (usage ? { usage, reselling: undefined, affiliate: undefined } : null),
    [usage]
  );

  const showDeletionBanner = useMemo(() => {
    if (!user?.createdAt) return false;
    if (Number(balance) > 0) return false;
    const now = new Date();
    const hasActive = orders.some((o) => {
      const st = toOrderStatus(o.status);
      return st === OrderStatus.IN_PROGRESS || st === OrderStatus.QUEUED;
    });
    if (hasActive) return false;
    const noEmail = !user.email || String(user.email).startsWith('telegram_');
    if (!noEmail) return false;
    if (user.telegramId) return false;
    return true;
  }, [user, balance, orders]);

  const deletionDeadlineMs = useMemo(() => {
    if (!user?.createdAt || !showDeletionBanner) return 0;
    return new Date(user.createdAt).getTime() + DELETION_HOURS * 60 * 60 * 1000;
  }, [user?.createdAt, showDeletionBanner]);

  useEffect(() => {
    if (!showDeletionBanner || deletionDeadlineMs <= 0) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((deletionDeadlineMs - Date.now()) / 1000));
      const h = Math.floor(left / 3600);
      const m = Math.floor((left % 3600) / 60);
      const s = left % 60;
      setDeletionCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showDeletionBanner, deletionDeadlineMs]);

  const displayOrders: DisplayOrderNoIcon[] = useMemo(() => orders.map(orderToDisplayOrder), [orders]);

  return {
    dashboardData,
    orders: displayOrders,
    balance,
    currency,
    loading,
    error,
    showDeletionBanner,
    deletionCountdown,
    refetch: load,
  };
}
