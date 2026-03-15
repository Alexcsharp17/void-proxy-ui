/**
 * String enum constants matching backend (ServiceType, OrderStatus).
 * API may return either numbers or these strings; use normalizers when comparing.
 */

export const ServiceType = {
  Proxies: 'Proxies',
  TelegramComments: 'TelegramComments',
  TelegramLikes: 'TelegramLikes',
  TelegramFollowers: 'TelegramFollowers',
  TwitterFollowers: 'TwitterFollowers',
  TwitterLikes: 'TwitterLikes',
  TwitterRetweets: 'TwitterRetweets',
  TwitterComments: 'TwitterComments',
  InstagramFollowers: 'InstagramFollowers',
  InstagramLikes: 'InstagramLikes',
  InstagramComments: 'InstagramComments',
  YouTubeSubscribers: 'YouTubeSubscribers',
  YouTubeLikes: 'YouTubeLikes',
  YouTubeComments: 'YouTubeComments',
  TikTokFollowers: 'TikTokFollowers',
  TikTokLikes: 'TikTokLikes',
  TikTokComments: 'TikTokComments',
  TwitterViews: 'TwitterViews',
  TwitterQuoteTweets: 'TwitterQuoteTweets',
  AddOns: 'AddOns',
} as const;

export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const OrderStatus = {
  QUEUED: 'QUEUED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  CANCELLED: 'CANCELLED',
  PAUSED: 'PAUSED',
  PARTIALLY_COMPLETED: 'PARTIALLY_COMPLETED',
  EXPIRED: 'EXPIRED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

const SERVICE_TYPE_NUM_TO_STR: Record<number, string> = {
  1: 'TwitterFollowers',
  2: 'TwitterLikes',
  3: 'TwitterRetweets',
  4: 'TwitterComments',
  5: 'InstagramFollowers',
  6: 'InstagramLikes',
  7: 'InstagramComments',
  8: 'TelegramFollowers',
  9: 'TelegramLikes',
  10: 'TelegramComments',
  11: 'YouTubeSubscribers',
  12: 'YouTubeLikes',
  13: 'YouTubeComments',
  14: 'TikTokFollowers',
  15: 'TikTokLikes',
  16: 'TikTokComments',
  17: 'Proxies',
  18: 'TwitterViews',
  19: 'TwitterQuoteTweets',
  20: 'AddOns',
};

const ORDER_STATUS_NUM_TO_STR: Record<number, string> = {
  0: 'QUEUED',
  1: 'IN_PROGRESS',
  2: 'COMPLETED',
  3: 'ERROR',
  4: 'CANCELLED',
  5: 'PAUSED',
  6: 'PARTIALLY_COMPLETED',
  7: 'EXPIRED',
  8: 'AWAITING_PAYMENT',
};

/** Normalize serviceType from API (number or string) to string */
export function toServiceType(v: number | string | undefined | null): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return SERVICE_TYPE_NUM_TO_STR[v] ?? String(v);
}

/** Normalize order status from API (number or string) to string */
export function toOrderStatus(v: number | string | undefined | null): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return ORDER_STATUS_NUM_TO_STR[v] ?? String(v);
}
