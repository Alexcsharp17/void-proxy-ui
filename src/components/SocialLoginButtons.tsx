import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SocialLoginButtonsProps {
  onError?: (error: string) => void;
}

const TELEGRAM_BOT_USERNAME =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME
    ? String((import.meta as any).env.VITE_TELEGRAM_BOT_USERNAME)
    : '';

export default function SocialLoginButtons({ onError }: SocialLoginButtonsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTelegram, loginWithGoogle } = useAuth();
  const telegramContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME || !telegramContainerRef.current) return;

    (window as unknown as Record<string, unknown>).onTelegramAuth = async (user: unknown) => {
      onError?.('');
      const u = user as Record<string, unknown> | null;
      if (!u?.id || !u?.hash || !u?.auth_date) {
        onError?.('Invalid Telegram authentication data');
        return;
      }
      try {
        const normalizedData = {
          id: String(u.id),
          first_name: (u.first_name as string) || '',
          last_name: u.last_name as string | undefined,
          username: u.username as string | undefined,
          photo_url: u.photo_url as string | undefined,
          auth_date: String(u.auth_date),
          hash: u.hash as string,
        };
        const success = await loginWithTelegram(normalizedData);
        if (success) {
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo, { replace: true });
        } else {
          onError?.('Telegram sign-in failed');
        }
      } catch {
        onError?.('Telegram sign-in failed');
      }
    };

    const container = telegramContainerRef.current;
    if (container.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-radius', '8');
    script.async = true;
    container.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>).onTelegramAuth;
      const s = container.querySelector('script');
      if (s) s.remove();
    };
  }, [loginWithTelegram, navigate, searchParams, onError]);

  useEffect(() => {
    const clientId =
      typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID
        ? String((import.meta as any).env.VITE_GOOGLE_CLIENT_ID)
        : '';
    if (!clientId) return;

    const init = () => {
      const g = (window as unknown as { google?: { accounts?: { id?: { initialize: (c: unknown) => void; prompt: () => void } } } }).google;
      if (!g?.accounts?.id) {
        setTimeout(init, 100);
        return;
      }
      if ((window as unknown as Record<string, boolean>).__voidGoogleSignInInit) return;
      (window as unknown as Record<string, boolean>).__voidGoogleSignInInit = true;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          onError?.('');
          if (!response?.credential) {
            onError?.('Invalid Google authentication data');
            return;
          }
          loginWithGoogle(response.credential).then((success) => {
            if (success) {
              const redirectTo = searchParams.get('redirect') || '/';
              navigate(redirectTo, { replace: true });
            } else {
              onError?.('Google sign-in failed');
            }
          }).catch(() => onError?.('Google sign-in failed'));
        },
      });
    };
    init();
    return () => {
      (window as unknown as Record<string, boolean>).__voidGoogleSignInInit = false;
    };
  }, [loginWithGoogle, navigate, searchParams, onError]);

  const handleGoogleClick = () => {
    const g = (window as unknown as { google?: { accounts?: { id?: { prompt: () => void } } } }).google;
    if (g?.accounts?.id) g.accounts.id.prompt();
    else onError?.('Google Sign-In not loaded');
  };

  const handleTelegramClick = () => {
    const container = telegramContainerRef.current;
    if (!container) return;
    const iframe = container.querySelector('iframe');
    const src = (iframe as HTMLIFrameElement)?.src;
    if (src?.includes('oauth.telegram.org')) {
      try {
        const url = new URL(src);
        const botId = url.searchParams.get('bot_id') || (import.meta as any).env?.VITE_TELEGRAM_BOT_ID;
        if (botId) {
          const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(window.location.href)}&request_access=write`;
          window.location.href = authUrl;
        }
      } catch {
        const link = container.querySelector('a');
        if (link) (link as HTMLAnchorElement).click();
      }
    } else {
      const link = container.querySelector('a');
      if (link) (link as HTMLAnchorElement).click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-center gap-3 relative">
        {TELEGRAM_BOT_USERNAME && (
          <>
            <div
              ref={telegramContainerRef}
              className="absolute left-[-9999px] w-[300px] h-[60px] overflow-hidden opacity-0 pointer-events-none"
              aria-hidden
            />
            <button
              type="button"
              onClick={handleTelegramClick}
              className="w-12 h-12 rounded-full border border-border-main bg-bg-panel flex items-center justify-center text-text-primary hover:border-accent-primary/50 hover:bg-bg-input transition-colors"
              aria-label="Sign in with Telegram"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#2AABEE">
                <path d="M9.78 18.65L10.06 14.42L17.74 7.5C18.08 7.19 17.67 7.04 17.22 7.31L7.74 13.3L3.64 12C2.76 11.75 2.75 11.14 3.84 10.7L19.81 4.54C20.54 4.21 21.24 4.72 20.96 5.84L18.24 18.65C18.05 19.56 17.5 19.78 16.74 19.36L12.6 16.3L10.61 18.23C10.38 18.46 10.19 18.65 9.78 18.65Z" />
              </svg>
            </button>
          </>
        )}
        {(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID && (
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-12 h-12 rounded-full border border-border-main bg-bg-panel flex items-center justify-center text-text-primary hover:border-accent-primary/50 hover:bg-bg-input transition-colors"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
