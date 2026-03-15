import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';
import TurnstileWidget from '../components/TurnstileWidget';
import { isTurnstileDisabled } from '../utils/turnstile';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('validation.required'));
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError(t('validation.emailInvalid'));
      setLoading(false);
      return;
    }
    if (!isTurnstileDisabled() && !turnstileToken && !captchaPassed) {
      setError(t('login.securityVerification'));
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.forgotPassword(trimmed);
      if (res.success) {
        setSuccess(res.message || t('forgotPassword.resetLinkSent'));
      } else {
        setError(res.message || t('forgotPassword.errorSending'));
      }
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setError(res.response?.data?.message || t('forgotPassword.errorSending'));
      setTurnstileToken(null);
      setCaptchaPassed(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src="/void.svg" alt="Void" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">{t('forgotPassword.title')}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2">
              {success}
            </div>
            <Link
              to="/login"
              className="block w-full text-center rounded-lg bg-accent-primary text-white font-medium py-2.5 hover:opacity-90"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
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
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t('forgotPassword.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                required
              />
            </div>
            <TurnstileWidget
              onSuccess={(token) => {
                setTurnstileToken(token);
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
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-accent-primary hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
