/**
 * API types aligned with SSPanel backend (api/v2).
 */

export interface User {
  /** API may return number (login) or string (e.g. /user/info). */
  id: number | string;
  email?: string | null;
  name?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isAdmin?: boolean;
  role?: 'USER' | 'ADMIN' | 'RESELLER';
  isEmailVerified?: boolean;
  apiKey?: string;
  referralCode?: string;
  refererId?: number | null;
  createdAt: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  photoUrl?: string | null;
  language?: 'en' | 'ru';
  resellerWebhookUrl?: string | null;
  resellerWebhookSecret?: string | null;
  hasSpeedBoost?: boolean;
  userRank?: 'USER' | 'AFFILIATE' | 'AFFILIATE_PRO' | 'RESELLER';
}

export interface AuthResponse {
  user: User;
  token: string;
  requiresVerification?: boolean;
  apiKey?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface RegisterRequest {
  email?: string;
  password?: string;
  name?: string;
  referralCode?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
}

export interface ResendVerificationResponse {
  message?: string;
}

export interface AuthMeResponse {
  user: User;
  token: string;
}

/**
 * Постраничный список заказов с API — аналог `List<T>` в C# плюс total/page/pageSize.
 * Поле массива в JSON называется `orders` (контракт бэкенда).
 */
export type PagedList<T> = {
  orders: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Backend GET /orders: элементы Order (serviceType/status могут быть number или string) */
export interface Order {
  id: number;
  userId: string;
  serviceType: number | string;
  link?: string;
  quantity: number;
  status: number | string;
  completed: number;
  progress?: number;
  charge?: string;
  errorMessage?: string;
  /** May be string or localized { en?, ru? } from API */
  productName?: string | { en?: string; ru?: string };
  baseUnit?: string;
  displayUnit?: string;
  createdAt: string;
  updatedAt: string;
  quantityRemaining?: number;
  expiresAt?: string | null;
  autoRefill?: boolean;
  autoRefillAmountGb?: number | null;
  /** SPEED tier for unlimited proxy orders */
  selectedModifiers?: Array<{ type?: string; level?: number }>;
  /** Nested product (GET /orders includes it) — used for speed label from modificatorLevels */
  product?: {
    modificatorLevels?: Record<string, Array<{ level?: number; label?: string; speed?: number }>>;
    attributes?: { technical?: { isUnlimited?: boolean } };
  };
}

/** Backend POST /balance returns this */
export interface BalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  message?: string;
}

/** Single proxy check result (POST /proxies/check-ip) */
export interface ProxyCheckResult {
  ip: string;
  results?: { country?: string; countryCode?: string }[];
  finalStatus?: 'clean' | 'blacklisted' | 'unknown';
  finalMessage?: string;
  avgLatencyMs?: number;
  minLatencyMs?: number;
  maxLatencyMs?: number;
  country?: string;
  countryCode?: string;
  success?: boolean;
  message?: string;
}

export interface ProxyCheckResponse {
  success: boolean;
  data?: ProxyCheckResult;
  message?: string;
}

/** Batch proxy check (body.connectionStrings) */
export interface ProxyCheckBatchResponse {
  success: boolean;
  data?: {
    proxies: ProxyCheckResult[];
    aggregatedLatency?: { minLatencyMs: number; avgLatencyMs: number; maxLatencyMs: number };
  };
  message?: string;
}

/** Tier/package from API (product.tiers or product.packages) */
export interface ProductTier {
  price?: number;
  displayName?: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  [key: string]: unknown;
}

/** Single entry from GET /products/:id/pricing-table */
export interface PricingTableEntry {
  productId: number;
  productName: string;
  packageDisplayName: string;
  quantity: number;
  quantityDisplay: string;
  speedMbps?: number;
  modifierTier?: number;
  modifier?: { level: number; speed?: number; days?: number; multiplier: number; label: string; type: string; metadata?: unknown };
  basePrice: number;
  totalPrice: number;
}

/** Response from GET /products/:id/pricing-table */
export interface PricingTableResponse {
  serviceType: string;
  products: Array<{
    productId: number;
    productName: string;
    pricingTable: PricingTableEntry[];
  }>;
}

/** Modifier level from getPricingModifiers */
export interface PricingModifierLevel {
  value: number;
  label: string;
  metadata?: { speed?: number; days?: number; multiplier?: number; [key: string]: unknown };
}

/** Response from GET /products/pricing-modifiers?productId= */
export interface PricingModifiersResponse {
  [key: string]: {
    type: string;
    levels: PricingModifierLevel[];
  };
}

/** UI attribute from productDetails.ui (label/value can be localized) */
export interface ProductUiAttribute {
  key: string;
  label: string | { en?: string; ru?: string };
  value: string | { en?: string; ru?: string };
  emoji?: string;
  priority?: number;
}

/** Product from GET /products/proxies (public) */
export interface Product {
  id: number | string;
  name: string | { en?: string; ru?: string };
  displayName?: string;
  description?: string | { en?: string; ru?: string };
  fullDescription?: string;
  serviceType: number | string;
  isActive: boolean;
  basePrice?: number;
  displayUnit?: string;
  baseUnit?: string;
  productDetails?: {
    ui?: ProductUiAttribute[];
    [key: string]: unknown;
  };
  /** Pricing tiers (from API dto.tiers) */
  tiers?: ProductTier[];
  [key: string]: unknown;
}
