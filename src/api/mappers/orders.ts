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

function isUnlimitedTimeProxyOrder(order: ApiOrder): boolean {
  const bu = (order.baseUnit ?? '').toLowerCase();
  const du = (order.displayUnit ?? '').toLowerCase();
  if (bu === 'second' && du === 'hour') return true;
  const tech = order.product?.attributes?.technical;
  return tech?.isUnlimited === true;
}

function resolveUnlimitedSpeedSuffix(order: ApiOrder): string | undefined {
  if (!isUnlimitedTimeProxyOrder(order)) return undefined;
  const mods = order.selectedModifiers;
  const speedMod = mods?.find((m) => String(m.type ?? '').toUpperCase() === 'SPEED');
  const level = speedMod?.level;
  if (level == null) return undefined;
  const levels = order.product?.modificatorLevels?.SPEED;
  if (Array.isArray(levels)) {
    const match = levels.find((l) => Number(l.level) === Number(level));
    if (match?.label) return String(match.label).trim();
    if (match?.speed != null && Number.isFinite(Number(match.speed))) {
      const s = Number(match.speed);
      if (s >= 1000 && s % 1000 === 0) return `${s / 1000} Gbps`;
      return `${s} Mbps`;
    }
  }
  return undefined;
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

/** One side of "rem / total" for time-based unlimited proxy (same idea as GB). Exported for OrderRow live ticks. */
export function formatUnlimitedTimeRatioPart(seconds: number): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s >= 86400) {
    const d = s / 86400;
    return Number.isInteger(d) ? `${d}d` : `${d.toFixed(1)}d`;
  }
  if (s >= 3600) {
    const h = s / 3600;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`.replace(/\.0h$/, 'h');
  }
  if (s >= 60) {
    return `${Math.floor(s / 60)} min`;
  }
  return `${s}s`;
}

function remainingSecondsSnapshot(order: ApiOrder, effectiveLimitSeconds: number): number {
  if (order.expiresAt) {
    return Math.max(
      0,
      Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)
    );
  }
  const qr = order.quantityRemaining;
  if (qr != null && !Number.isNaN(Number(qr))) {
    return Math.max(0, Number(qr));
  }
  if (!order.createdAt) return effectiveLimitSeconds;
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
  return Math.max(0, effectiveLimitSeconds - elapsed);
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
    const totalSec = Math.max(Number(q), Number(order.quantityRemaining ?? q), 1);
    const remSec = remainingSecondsSnapshot(order, totalSec);
    return `${formatUnlimitedTimeRatioPart(remSec)} / ${formatUnlimitedTimeRatioPart(totalSec)}`;
  }
  return `${order.completed ?? 0}/${q}`;
}

function unlimitedTimeMetaForOrder(order: ApiOrder):
  | {
      createdAt: string;
      effectiveLimitSeconds: number;
      expiresAt?: string | null;
      quantityRemainingSec?: number;
    }
  | undefined {
  const baseUnit = (order.baseUnit ?? '').toLowerCase();
  const displayUnit = (order.displayUnit ?? '').toLowerCase();
  if (baseUnit !== 'second' || displayUnit !== 'hour') return undefined;
  if (!order.createdAt) return undefined;
  const effectiveLimit = Math.max(Number(order.quantity ?? 0), Number(order.quantityRemaining ?? 0));
  if (effectiveLimit <= 0) return undefined;
  const qr = order.quantityRemaining;
  return {
    createdAt: order.createdAt,
    effectiveLimitSeconds: effectiveLimit,
    expiresAt: order.expiresAt ?? null,
    quantityRemainingSec: qr != null && !Number.isNaN(Number(qr)) ? Number(qr) : undefined,
  };
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

export type OrderProductType = 'proxies' | 'telegram' | 'addons' | 'other';

export interface DisplayOrderNoIcon extends Omit<DisplayOrder, 'icon'> {
  productType: OrderProductType;
  unlimitedTimeMeta?: { createdAt: string; effectiveLimitSeconds: number };
  productSpeedSuffix?: string;
}

export function orderToDisplayOrder(apiOrder: ApiOrder): DisplayOrderNoIcon {
  const st = toServiceType(apiOrder.serviceType);
  const productType: OrderProductType =
    st === ServiceType.Proxies
      ? 'proxies'
      : st === ServiceType.TelegramComments || st === ServiceType.TelegramLikes || st === ServiceType.TelegramFollowers
        ? 'telegram'
        : st === ServiceType.AddOns
          ? 'addons'
          : 'other';
  return {
    id: String(apiOrder.id),
    product: getProductLabel(apiOrder),
    productSpeedSuffix: resolveUnlimitedSpeedSuffix(apiOrder),
    quantity: formatQuantity(apiOrder),
    unlimitedTimeMeta: unlimitedTimeMetaForOrder(apiOrder),
    status: toDisplayStatus(apiOrder.status),
    date: formatDate(apiOrder.createdAt),
    price: apiOrder.charge ? `$${apiOrder.charge}` : '—',
    timeAgo: timeAgo(apiOrder.createdAt),
    productType,
  };
}
