/**
 * Promo code API: validate and apply (discount) for order total.
 */
import { api } from './client';

export interface PromoCodeDto {
  id?: number;
  code: string;
  discountPercent?: number;
  bonusType?: 'USD' | 'GB' | 'HOUR' | null;
  bonusAmount?: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface ValidatePromoResponse {
  isValid: boolean;
  promoCode?: PromoCodeDto;
  error?: string;
}

export interface ApplyPromoResponse {
  discountedPrice: number;
  bonusType?: 'USD' | 'GB' | 'HOUR' | null;
  bonusAmount: number;
  discountAmount: number;
}

export const promoApi = {
  async validate(code: string): Promise<ValidatePromoResponse> {
    const res = await api.post<ValidatePromoResponse>('/promo/validate', { code: code.trim().toUpperCase() });
    return res.data;
  },
  async apply(code: string, price: number): Promise<ApplyPromoResponse> {
    const res = await api.post<ApplyPromoResponse>('/promo/apply', { code: code.trim().toUpperCase(), price });
    return res.data;
  },
};
