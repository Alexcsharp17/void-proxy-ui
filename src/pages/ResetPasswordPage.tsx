import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';
import TurnstileWidget from '../components/TurnstileWidget';
import { isTurnstileDisabled } from '../utils/turnstile';

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);

  useEffect(() => {
    const tok = searchParams.get('token');
    if (tok) setToken(tok);
    else setError(t('resetPassword.invalidToken'));
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError(t('validation.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError(t('validation.passwordMinLength'));
      setLoading(false);
      return;
    }
    if (!isTurnstileDisabled() && !turnstileToken && !captchaPassed) {
      setError(t('login.securityVerification'));
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.resetPassword(token, password);
      if (res.success) {
        setSuccess(res.message || t('resetPassword.passwordUpdated'));
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } else {
        setError(res.message || t('resetPassword.errorResetting'));
      }
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setError(res.response?.data?.message || t('resetPassword.errorResetting'));
      setTurnstileToken(null);
      setCaptchaPassed(false);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
        <div className="animate-pulse text-text-secondary">{t('common:loading')}</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2">
            {error}
          </div>
          <p className="text-text-secondary text-sm">{t('resetPassword.linkExpired')}</p>
          <Link
            to="/forgot-password"
            className="inline-block rounded-lg bg-accent-primary text-white font-medium px-4 py-2.5 hover:opacity-90"
          >
            {t('resetPassword.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">{t('resetPassword.title')}</h1>
          <p className="text-text-secondary text-sm mt-1">{t('resetPassword.subtitle')}</p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2">
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t('resetPassword.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t('resetPassword.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                required
              />
            </div>
            <TurnstileWidget
              onSuccess={(t) => {
                setTurnstileToken(t);
                setCaptchaPassed(true);
              }}
              onError={() => {
                setTurnstileToken(null);
                setCaptchaPassed(false);
              }}
              onExpire={() => {
                setTurnstileToken(null);
                setCaptchaPassed(false);
              }}
            />
            <button
              type="submit"
              disabled={
                loading ||
                (!isTurnstileDisabled() && !turnstileToken && !captchaPassed)
              }
              className="w-full rounded-lg bg-accent-primary text-white font-medium py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-accent-primary hover:underline">
            {t('resetPassword.continueToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
