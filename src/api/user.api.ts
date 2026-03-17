import { api } from './client';
import type { User, BalanceResponse } from './types';

export interface ReferralTierRow {
  tierName: string;
  emoji: string;
  percent: number;
  nextAt: number | null;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  totalReferralVolume: number;
  commissionRate: number;
  referralCode: string;
  referralLevel: string;
  userRank: string;
  currentTierLabel: string;
  tierName?: string;
  tierEmoji?: string;
  nextTierAt?: number | null;
  tiersLadder?: ReferralTierRow[];
}

export const userApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.post<User>('/user/info');
    return res.data;
  },

  getBalance: async (): Promise<BalanceResponse> => {
    const res = await api.post<BalanceResponse>('/balance', {});
    return res.data;
  },

  getReferralCode: async (): Promise<string> => {
    const res = await api.get<string>('/referral-code');
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  },

  getReferralStats: async (): Promise<ReferralStats> => {
    const res = await api.get<ReferralStats>('/referral/stats');
    return res.data ?? { totalReferrals: 0, totalEarnings: 0, totalReferralVolume: 0, commissionRate: 0, referralCode: '', referralLevel: '', userRank: 'USER', currentTierLabel: '', tierName: 'Bronze', tierEmoji: '🥉', nextTierAt: 500, tiersLadder: [] };
  },

  getReferrals: async (): Promise<unknown[]> => {
    const res = await api.get<unknown[]>('/referrals');
    return Array.isArray(res.data) ? res.data : [];
  },

  getApiKey: async (): Promise<{ apiKey: string }> => {
    const res = await api.get<{ apiKey: string }>('/user/api-key');
    return res.data ?? { apiKey: '' };
  },

  updateResellerWebhookUrl: async (webhookUrl: string | null): Promise<{ success: boolean; message: string }> => {
    const res = await api.put<{ success: boolean; message: string }>('/user/reseller/webhook-url', { webhookUrl });
    return res.data;
  },

  regenerateResellerWebhookSecret: async (): Promise<{ success: boolean; secret: string; message: string }> => {
    const res = await api.post<{ success: boolean; secret: string; message: string }>('/user/reseller/regenerate-webhook-secret', {});
    return res.data;
  },

  /** Мягкое удаление аккаунта текущего пользователя (isDeleted = true). */
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>('/user/delete-account', {});
    return res.data;
  },
};
