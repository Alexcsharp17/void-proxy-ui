import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';

export default function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    const em = emailParam || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : null) || '';
    setEmail(em);
  }, [emailParam]);

  useEffect(() => {
    if (!tokenParam) {
      setLoading(false);
      setError(t('verifyEmail.subtitle'));
      return;
    }

    const run = async () => {
      setLoading(true);
      setError('');
      const em = emailParam || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : null) || '';
      setEmail(em);

      try {
        const isCode = /^\d{6}$/.test(tokenParam);
        const res = isCode && em
          ? await authApi.verifyEmailCode(em, tokenParam)
          : await authApi.verifyEmail(tokenParam);
        if (res.success) {
          setSuccess(true);
        } else {
          setError((res as { message?: string }).message || t('verifyEmail.subtitle'));
        }
      } catch (err: unknown) {
        const res = err as { response?: { data?: { message?: string } } };
        setError(res.response?.data?.message || t('verifyEmail.subtitle'));
      } finally {
        setLoading(false);
      }
    };

    const em = emailParam || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : null) || '';
    if (/^\d{6}$/.test(tokenParam) && !em) {
      setLoading(false);
      setError(t('validation.required'));
      return;
    }
    run();
  }, [tokenParam, emailParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-primary p-4 gap-4">
        <img src="/void.svg" alt="Void" className="h-10 w-auto" />
        <div className="animate-pulse text-text-secondary">{t('verifyEmail.verify')}…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <img src="/void.svg" alt="Void" className="h-10 w-auto mx-auto mb-4" />
        {success ? (
          <>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2">
              {t('verifyEmail.verifiedSuccess')}
            </div>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-accent-primary text-white font-medium px-4 py-2.5 hover:opacity-90"
            >
              {t('login.signIn')}
            </Link>
          </>
        ) : (
          <>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2">
                {error}
              </div>
            )}
            <Link
              to="/login"
              className="text-accent-primary hover:underline"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
