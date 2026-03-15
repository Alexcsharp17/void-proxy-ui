import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, userApi, setApiToken, setOnUnauthorized } from '../api';
import { setGetUserFunction } from '../i18n/config';
import type { User } from '../api';

const STORAGE_TOKEN = 'token';
const STORAGE_USER = 'user';
const STORAGE_API_KEY = 'apiKey';

export interface TelegramLoginData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  initData?: string;
}

function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { response?: { status?: number }; code?: string };
    if (err.response === undefined) return true;
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
    if (typeof err.response?.status === 'number' && err.response.status >= 500) return true;
  }
  return false;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiUnreachable: boolean;
  retryAuth: () => Promise<void>;
  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  loginByApiKey: (apiKey: string) => Promise<boolean>;
  loginWithTelegram: (data: TelegramLoginData) => Promise<boolean>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onUnauthorizedRedirect?: () => void;
}

async function ensureApiKeyAndStore(token: string, user: User): Promise<void> {
  const existing = (user as User & { apiKey?: string }).apiKey;
  if (existing) {
    try {
      localStorage.setItem(STORAGE_API_KEY, existing);
    } catch {}
    return;
  }
  try {
    const { apiKey } = await authApi.generateApiKey(token);
    if (apiKey) localStorage.setItem(STORAGE_API_KEY, apiKey);
  } catch {
    // Ignore; apiKey will be generated on next login if needed
  }
}

export function AuthProvider({ children, onUnauthorizedRedirect }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUnreachable, setApiUnreachable] = useState(false);

  const clearSession = useCallback(() => {
    setApiToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_API_KEY);
    } catch {}
  }, []);

  const checkAuth = useCallback(async () => {
    setApiUnreachable(false);
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      setApiToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }
    setApiToken(token);
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
      setApiUnreachable(false);
      try {
        localStorage.setItem(STORAGE_USER, JSON.stringify(profile));
      } catch {}
    } catch (e) {
      if (isNetworkError(e)) {
        setApiUnreachable(true);
        return;
      }
      const stored = localStorage.getItem(STORAGE_USER);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setGetUserFunction(() => user);
  }, [user]);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearSession();
      onUnauthorizedRedirect?.();
    });
    checkAuth();
    return () => setOnUnauthorized(null);
  }, [checkAuth, clearSession, onUnauthorizedRedirect]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken?: string): Promise<boolean> => {
      try {
        const data = await authApi.login({
          email,
          password,
          ...(turnstileToken && { turnstileToken }),
        });
        if (data.requiresVerification) return false;
        if (data.token) {
          setApiToken(data.token);
          localStorage.setItem(STORAGE_TOKEN, data.token);
        }
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
          } catch {}
          if (data.token) await ensureApiKeyAndStore(data.token, data.user);
        }
        return true;
      } catch (e) {
        throw e;
      }
    },
    []
  );

  const loginByApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    try {
      const trimmed = apiKey.trim();
      if (!trimmed) return false;
      const data = await authApi.getMeByApiKey(trimmed);
      if (!data?.user) return false;
      const token = data.token || trimmed;
      setApiToken(token);
      localStorage.setItem(STORAGE_TOKEN, token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
      localStorage.setItem(STORAGE_API_KEY, trimmed);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loginWithTelegram = useCallback(async (data: TelegramLoginData): Promise<boolean> => {
    try {
      const res = await authApi.telegramLogin(data);
      if (!res.user || !res.token) return false;
      setApiToken(res.token);
      localStorage.setItem(STORAGE_TOKEN, res.token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(res.user));
      setUser(res.user);
      await ensureApiKeyAndStore(res.token, res.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await authApi.googleLogin(token);
      if (!res.user || !res.token) return false;
      setApiToken(res.token);
      localStorage.setItem(STORAGE_TOKEN, res.token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(res.user));
      setUser(res.user);
      await ensureApiKeyAndStore(res.token, res.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearSession();
  }, [clearSession]);

  const retryAuth = useCallback(async () => {
    setApiUnreachable(false);
    setIsLoading(true);
    await checkAuth();
  }, [checkAuth]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    apiUnreachable,
    retryAuth,
    login,
    loginByApiKey,
    loginWithTelegram,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
