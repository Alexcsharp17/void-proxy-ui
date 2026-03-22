import { ReactNode } from 'react';

export type Page = 'overview' | 'reselling' | 'affiliate' | 'settings' | 'proxy-checker' | 'proxy-generator' | 'deposit' | 'support' | 'addons' | 'plans' | 'purchase';

/** Mirrors `orderToDisplayOrder` — used for dashboard filters and icons. */
export type OrderProductCategory = 'proxies' | 'telegram' | 'addons' | 'other';

export interface Order {
  id: string;
  product: string;
  /** Unlimited proxy: speed tier (e.g. "500 Mbps") — shown in smaller type next to the title */
  productSpeedSuffix?: string;
  quantity: string;
  productType: OrderProductCategory;
  /**
   * Unlimited proxy (second/hour): remaining/total duration like GB traffic line.
   * Remaining updates every second when expiresAt is set.
   */
  unlimitedTimeMeta?: {
    createdAt: string;
    effectiveLimitSeconds: number;
    expiresAt?: string | null;
    quantityRemainingSec?: number;
  };
  status: 'Completed' | 'Queued' | 'Partial' | 'Processing' | 'Error' | 'Cancelled';
  date: string;
  price: string;
  timeAgo: string;
  icon: ReactNode;
}
