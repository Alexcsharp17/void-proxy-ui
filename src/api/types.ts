/**
 * API types aligned with SSPanel backend (api/v2).
 */

export interface User {
  id: number;
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

/** Backend GET /orders returns array of Order (serviceType/status may be number or string) */
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
