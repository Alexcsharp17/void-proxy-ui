import { api } from './client';
import type {
  AuthResponse,
  AuthMeResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
} from './types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore; clear local state anyway
    }
  },

  getMeByApiKey: async (apiKey: string): Promise<AuthMeResponse> => {
    const res = await api.post<AuthMeResponse>('/auth/me', { key: apiKey }, {
      headers: { 'X-API-Key': apiKey },
    });
    return res.data;
  },

  generateApiKey: async (token: string): Promise<{ apiKey: string }> => {
    const res = await api.post<{ apiKey: string }>('/auth/api-key', { key: token });
    return res.data;
  },

  telegramLogin: async (data: {
    id: string;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: string;
    hash: string;
    initData?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/telegram/login', data);
    return res.data;
  },

  googleLogin: async (token: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/google/login', { token });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const res = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<ResetPasswordResponse> => {
    const res = await api.post<ResetPasswordResponse>('/auth/reset-password', { token, password });
    return res.data;
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const res = await api.post<VerifyEmailResponse>('/auth/verify-email', { token });
    return res.data;
  },

  verifyEmailCode: async (email: string, code: string): Promise<VerifyEmailResponse> => {
    const res = await api.post<VerifyEmailResponse>('/auth/verify-email-code', { email, code });
    return res.data;
  },

  resendVerification: async (email: string): Promise<ResendVerificationResponse> => {
    const res = await api.post<ResendVerificationResponse>('/auth/resend-verification', { email });
    return res.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await api.post<{ success: boolean; message?: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
};
