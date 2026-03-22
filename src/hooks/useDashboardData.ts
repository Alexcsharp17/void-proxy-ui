import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ordersApi, userApi } from '../api';
import type { Order as ApiOrder } from '../api';
import { orderToDisplayOrder } from '../api/mappers/orders';
import type { DisplayOrderNoIcon } from '../api/mappers/orders';
import { toServiceType, toOrderStatus, ServiceType, OrderStatus } from '../enums/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../api';

const BYTES_PER_GB = 1024 ** 3;
const DELETION_HOURS = 48;

/** Сколько раз дернуть GET /orders подряд при сетевых/5xx сбоях */
const ORDERS_FETCH_MAX_ATTEMPTS = 5;
/** Пауза перед повтором: 2s, 4s, 8s, 16s (после 1–4 неудач) */
function ordersRetryDelayMs(attemptIndex: number): number {
  return Math.min(2000 * 2 ** attemptIndex, 20_000);
}

/** Если заказы так и не загрузились — тихий refetch раз в минуту, пока пользователь на странице */
const ORDERS_BACKGROUND_RETRY_MS = 60_000;

function userHasIdentity(user: User | null | undefined): boolean {
  if (user == null) return false;
  const id = user.id as unknown;
  if (id == null) return false;
  if (typeof id === 'string' && id.trim() === '') return false;
  if (typeof id === 'number' && !Number.isFinite(id)) return false;
  return true;
}

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
  /** Заказы ещё грузятся (таблица + usage из заказов). */
  loadingOrders: boolean;
  /** Баланс ещё грузится (хедер). */
  loadingBalance: boolean;
  /** Алиас: то же, что loadingOrders — для таблицы заказов. */
  loading: boolean;
  error: string | null;
  showDeletionBanner: boolean;
  deletionCountdown: string;
  /** Перезагрузка заказов и баланса параллельно, без блокировки друг друга. `{ showLoading: false }` — без спиннеров. */
  refetch: (options?: { showLoading?: boolean; ordersMaxAttempts?: number }) => Promise<void>;
} {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletionCountdown, setDeletionCountdown] = useState('00:00:00');

  /** Инкремент на каждый вызов load — отменяет устаревшие retry после смены user / unmount */
  const loadSessionRef = useRef(0);

  const load = useCallback(
    async (options?: { showLoading?: boolean; ordersMaxAttempts?: number }) => {
      if (!userHasIdentity(user)) {
        setOrders([]);
        setLoadingOrders(false);
        setLoadingBalance(false);
        return;
      }
      const session = ++loadSessionRef.current;
      const showLoading = options?.showLoading !== false;
      const maxOrderAttempts =
        options?.ordersMaxAttempts != null
          ? Math.max(1, options.ordersMaxAttempts)
          : ORDERS_FETCH_MAX_ATTEMPTS;
      if (showLoading) {
        setLoadingOrders(true);
        setLoadingBalance(true);
        setError(null);
      }

      const sortOrders = (list: ApiOrder[]) =>
        [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const balancePromise = userApi
        .getBalance()
        .then((balanceRes) => {
          if (session !== loadSessionRef.current) return;
          if (balanceRes?.success !== false) {
            setBalance(balanceRes.balance ?? 0);
            setCurrency(balanceRes.currency ?? 'USD');
          }
        })
        .catch(() => {
          if (session !== loadSessionRef.current) return;
          setBalance((b) => (b == null ? 0 : b));
        })
        .finally(() => {
          if (showLoading && session === loadSessionRef.current) setLoadingBalance(false);
        });

      let lastOrdersError = 'Failed to load orders';
      try {
        for (let attempt = 0; attempt < maxOrderAttempts; attempt++) {
          if (session !== loadSessionRef.current) return;
          try {
            const ordersRes = await ordersApi.getOrders({ page: 1, pageSize: 500 });
            if (session !== loadSessionRef.current) return;
            const list = ordersRes?.orders ?? [];
            setOrders(sortOrders(list));
            setError(null);
            lastOrdersError = '';
            break;
          } catch (e: unknown) {
            lastOrdersError = e instanceof Error ? e.message : 'Failed to load orders';
            const hasMoreAttempts = attempt < maxOrderAttempts - 1;
            if (hasMoreAttempts && session === loadSessionRef.current) {
              await new Promise((r) => setTimeout(r, ordersRetryDelayMs(attempt)));
            } else if (session === loadSessionRef.current) {
              setError(lastOrdersError);
            }
          }
        }
      } finally {
        if (showLoading && session === loadSessionRef.current) setLoadingOrders(false);
      }

      await balancePromise;
    },
    [user?.id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  /** Пока висит ошибка заказов и список пуст — периодически повторять (без спиннера) */
  useEffect(() => {
    if (!userHasIdentity(user)) return;
    if (error == null || error === '') return;
    if (orders.length > 0) return;

    const id = window.setInterval(() => {
      void load({ showLoading: false, ordersMaxAttempts: 1 });
    }, ORDERS_BACKGROUND_RETRY_MS);
    return () => window.clearInterval(id);
  }, [error, orders.length, user, load]);

  /** После curl / другого окна — обновить список при возврате на вкладку */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        void load({ showLoading: false, ordersMaxAttempts: 3 });
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
    loadingOrders,
    loadingBalance,
    loading: loadingOrders,
    error,
    showDeletionBanner,
    deletionCountdown,
    refetch: load,
  };
}
