import type { Order as ApiOrder } from '../types';
import type { Order as DisplayOrder } from '../../types';
import { toServiceType, toOrderStatus, ServiceType } from '../../enums/api';

/** Normalize productName: API may return string or { en?, ru? } */
function normalizeProductName(
  v: string | { en?: string; ru?: string } | undefined
): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (v.en ?? v.ru ?? '').trim() || '';
}

/** Map API status (string or number) to display status */
function toDisplayStatus(status: number | string): DisplayOrder['status'] {
  const s = toOrderStatus(status);
  const map: Record<string, DisplayOrder['status']> = {
    COMPLETED: 'Completed',
    IN_PROGRESS: 'Processing',
    QUEUED: 'Queued',
    PARTIALLY_COMPLETED: 'Partial',
    ERROR: 'Error',
    CANCELLED: 'Cancelled',
    PAUSED: 'Queued',
    EXPIRED: 'Cancelled',
    AWAITING_PAYMENT: 'Queued',
  };
  return map[s] ?? 'Queued';
}

function getProductLabel(order: ApiOrder): string {
  const name = normalizeProductName(order.productName);
  if (name) return name;
  const st = toServiceType(order.serviceType);
  switch (st) {
    case ServiceType.Proxies:
      return 'Proxies';
    case ServiceType.TelegramComments:
      return 'Telegram: Comments';
    case ServiceType.TelegramLikes:
      return 'Telegram: Likes';
    case ServiceType.TelegramFollowers:
      return 'Telegram: Subscribers';
    default:
      return st ? `Service ${st}` : 'Unknown';
  }
}

function formatQuantity(order: ApiOrder): string {
  const q = order.quantity ?? 0;
  const rem = order.quantityRemaining ?? q;
  const baseUnit = (order.baseUnit ?? '').toLowerCase();
  const displayUnit = (order.displayUnit ?? '').toLowerCase();
  if (baseUnit === 'byte' && (displayUnit === 'gb')) {
    const totalGb = (q / (1024 ** 3)).toFixed(2);
    const remGb = (rem / (1024 ** 3)).toFixed(2);
    return `${remGb} GB / ${totalGb} GB`;
  }
  if (baseUnit === 'second' && displayUnit === 'hour') {
    const effectiveLimit = Math.max(Number(q), Number(order.quantityRemaining ?? q));
    const hours = effectiveLimit / 3600;
    return `${hours.toFixed(2)} hour`;
  }
  return `${order.completed ?? 0}/${q}`;
}

function unlimitedTimeMetaForOrder(order: ApiOrder): { createdAt: string; effectiveLimitSeconds: number } | undefined {
  const baseUnit = (order.baseUnit ?? '').toLowerCase();
  const displayUnit = (order.displayUnit ?? '').toLowerCase();
  if (baseUnit !== 'second' || displayUnit !== 'hour') return undefined;
  if (!order.createdAt) return undefined;
  const effectiveLimit = Math.max(Number(order.quantity ?? 0), Number(order.quantityRemaining ?? 0));
  if (effectiveLimit <= 0) return undefined;
  return { createdAt: order.createdAt, effectiveLimitSeconds: effectiveLimit };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} days ago`;
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

export type OrderProductType = 'proxies' | 'telegram' | 'other';

export interface DisplayOrderNoIcon extends Omit<DisplayOrder, 'icon'> {
  productType: OrderProductType;
  unlimitedTimeMeta?: { createdAt: string; effectiveLimitSeconds: number };
}

export function orderToDisplayOrder(apiOrder: ApiOrder): DisplayOrderNoIcon {
  const st = toServiceType(apiOrder.serviceType);
  const productType: OrderProductType =
    st === ServiceType.Proxies
      ? 'proxies'
      : st === ServiceType.TelegramComments || st === ServiceType.TelegramLikes || st === ServiceType.TelegramFollowers
        ? 'telegram'
        : 'other';
  return {
    id: String(apiOrder.id),
    product: getProductLabel(apiOrder),
    quantity: formatQuantity(apiOrder),
    unlimitedTimeMeta: unlimitedTimeMetaForOrder(apiOrder),
    status: toDisplayStatus(apiOrder.status),
    date: formatDate(apiOrder.createdAt),
    price: apiOrder.charge ? `$${apiOrder.charge}` : '—',
    timeAgo: timeAgo(apiOrder.createdAt),
    productType,
  };
}
