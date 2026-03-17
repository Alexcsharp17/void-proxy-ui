import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { TelegramLoginData } from '../contexts/AuthContext';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          auth_date?: number | string;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

/**
 * Auto login/register when app is opened from Telegram Web App (Mini App).
 * Backend creates account if user does not exist.
 */
export function useTelegramWebApp() {
  const { loginWithTelegram, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (isAuthenticated && !isLoading) {
      const path = window.location.pathname;
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/', { replace: true });
      }
      return;
    }

    if (isLoading || autoLoginAttempted) return;

    const attemptLogin = () => {
      let initData = tg.initData ?? '';
      const userData = tg.initDataUnsafe?.user;

      if (!initData && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        initData = params.get('tgWebAppData') || params.get('_auth') || params.get('initData') || '';
        if (initData) initData = decodeURIComponent(initData);
      }
      if (!initData && window.location.hash) {
        const m = window.location.hash.match(/tgWebAppData=([^&]+)/);
        if (m) initData = decodeURIComponent(m[1]);
      }

      const parseInitData = (data: string): TelegramLoginData | null => {
        try {
          const params = new URLSearchParams(data);
          const userStr = params.get('user');
          const auth_date = params.get('auth_date');
          const hash = params.get('hash');
          if (!userStr || !hash || !auth_date) return null;
          const user = JSON.parse(decodeURIComponent(userStr));
          if (!user?.id) return null;
          return {
            id: String(user.id),
            first_name: user.first_name || '',
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
            auth_date,
            hash,
            initData: data,
          };
        } catch {
          return null;
        }
      };

      let payload = initData ? parseInitData(initData) : null;

      if (!payload && userData && tg.initDataUnsafe?.hash) {
        const unsafe = tg.initDataUnsafe;
        const auth_date = unsafe.auth_date != null ? String(unsafe.auth_date) : String(Math.floor(Date.now() / 1000));
        const hash = String(unsafe.hash);
        payload = {
          id: String(userData.id),
          first_name: userData.first_name || '',
          last_name: userData.last_name,
          username: userData.username,
          photo_url: userData.photo_url,
          auth_date,
          hash,
          initData: initData || undefined,
        };
      }

      if (!payload?.id || !payload?.hash) return false;

      setAutoLoginAttempted(true);
      loginWithTelegram(payload)
        .then((ok) => {
          if (ok) navigate('/', { replace: true });
        })
        .catch(() => {});
      return true;
    };

    if (attemptLogin()) return;

    const t = setTimeout(() => {
      if (!isAuthenticated && !autoLoginAttempted) {
        attemptLogin();
        setAutoLoginAttempted(true);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [isAuthenticated, isLoading, autoLoginAttempted, loginWithTelegram, navigate]);

  return { autoLoginAttempted };
}
