import { ReactNode } from 'react';

export type Page = 'overview' | 'reselling' | 'affiliate' | 'settings' | 'proxy-checker' | 'proxy-generator' | 'deposit' | 'support' | 'addons' | 'plans' | 'purchase';

export interface Order {
  id: string;
  product: string;
  quantity: string;
  /** Unlimited proxy (second/hour): live remaining time uses this + quantity line */
  unlimitedTimeMeta?: { createdAt: string; effectiveLimitSeconds: number };
  status: 'Completed' | 'Queued' | 'Partial' | 'Processing' | 'Error' | 'Cancelled';
  date: string;
  price: string;
  timeAgo: string;
  icon: ReactNode;
}
