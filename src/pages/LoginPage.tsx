import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButtons from '../components/SocialLoginButtons';
import TurnstileWidget from '../components/TurnstileWidget';
import { isTurnstileDisabled } from '../utils/turnstile';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginByApiKey, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  /** Увеличиваем только при явном сбросе капчи — НЕ при успехе (иначе key менялся бы на токен и ломал Turnstile). */
  const [turnstileResetId, setTurnstileResetId] = useState(0);

  const redirectTo = searchParams.get('redirect') || '/';

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setCaptchaPassed(false);
    setTurnstileResetId((n) => n + 1);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const useApiKey = apiKey.trim().length > 0;

    if (useApiKey) {
      try {
        const ok = await loginByApiKey(apiKey.trim());
        if (ok) {
          navigate(redirectTo, { replace: true });
        } else {
          setError(t('login.invalidToken'));
          resetTurnstile();
        }
      } catch {
        setError(t('login.loginFailed'));
        resetTurnstile();
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isTurnstileDisabled() && !turnstileToken && !captchaPassed) {
      setError(t('login.securityVerification'));
      setLoading(false);
      return;
    }

    try {
      const tokenToSend = isTurnstileDisabled() ? undefined : turnstileToken ?? undefined;
      const ok = await login(email.trim(), password, tokenToSend);
      if (ok) {
        navigate(redirectTo, { replace: true });
      } else {
        setError(t('login.emailVerificationRequired'));
        resetTurnstile();
      }
    } catch {
      setError(t('login.loginFailed'));
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const useApiKeyMode = apiKey.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src="/void.svg" alt="Void" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">{t('login.title')}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('login.token')}
            </label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={t('login.enterToken')}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 placeholder:text-text-muted"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-border-main" aria-hidden />
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('login.or')}</span>
            <span className="flex-1 h-px bg-border-main" aria-hidden />
          </div>

          <div style={{ display: useApiKeyMode ? 'none' : undefined }}>
            <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  required={!useApiKeyMode}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                    required={!useApiKeyMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
          </div>

          {!isTurnstileDisabled() && !captchaPassed && (
            <div className="min-h-[65px]">
              <TurnstileWidget
                key={turnstileResetId}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setCaptchaPassed(true);
                }}
                onError={resetTurnstile}
                onExpire={resetTurnstile}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (!useApiKeyMode && !isTurnstileDisabled() && !turnstileToken && !captchaPassed)
            }
            className="w-full rounded-lg bg-accent-primary text-white font-medium py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>

          {(typeof (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME === 'string' || typeof (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID === 'string') && (
            <div style={{ display: useApiKeyMode ? 'none' : undefined }} aria-hidden={useApiKeyMode}>
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-border-main" aria-hidden />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('login.or')}</span>
                <span className="flex-1 h-px bg-border-main" aria-hidden />
              </div>
              <p className="text-center text-xs text-text-muted mb-2">{t('login.orLoginWith')}</p>
              <SocialLoginButtons onError={setError} />
            </div>
          )}
        </form>

        <div className="flex flex-col gap-2 text-center text-sm">
          {!useApiKeyMode && (
            <Link
              to="/forgot-password"
              className="text-accent-primary hover:underline"
            >
              {t('login.forgotPassword')}
            </Link>
          )}
          <Link
            to="/register"
            className="text-text-secondary hover:text-text-primary"
          >
            {t('register.signUp')}
          </Link>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-primary transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
