import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi, setApiToken } from '../api';
import TurnstileWidget from '../components/TurnstileWidget';
import SuccessRegistrationModal from '../components/SuccessRegistrationModal';
import { isTurnstileDisabled } from '../utils/turnstile';

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInstantAccount = async () => {
    setError('');
    setSuccess('');
    setInstantLoading(true);
    try {
      const data = await authApi.register({
        referralCode: referralCode.trim() || undefined,
      });
      if (data.apiKey && data.token && data.user) {
        setApiToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('apiKey', data.apiKey);
        setGeneratedApiKey(data.apiKey);
        setShowSuccessModal(true);
        return;
      }
      setError(t('register.registrationError'));
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setError(res.response?.data?.message || t('register.registrationError'));
    } finally {
      setInstantLoading(false);
    }
  };

  const handleGoToDashboard = async () => {
    setShowSuccessModal(false);
    try {
      await checkAuth();
      navigate('/', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const handleResendVerification = async () => {
    const em = email.trim();
    if (!em) return;
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    try {
      const res = await authApi.resendVerification(em);
      setResendSuccess(res.message || t('verifyEmail.codeSent'));
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setError(res.response?.data?.message || t('register.registrationError'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRequiresVerification(false);
    setLoading(true);

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
      const data = await authApi.register({
        email: email.trim(),
        password,
        name: email.trim().split('@')[0],
        referralCode: referralCode.trim() || undefined,
      });

      if (data.requiresVerification) {
        setRequiresVerification(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userEmail', email.trim());
        }
        setSuccess(t('verifyEmail.subtitle'));
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        try {
          const { apiKey } = await authApi.generateApiKey(data.token);
          if (apiKey) localStorage.setItem('apiKey', apiKey);
        } catch {
          // apiKey can be generated on next login
        }
        await checkAuth();
        navigate('/', { replace: true });
        return;
      }

      setError(t('register.registrationError'));
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setError(res.response?.data?.message || t('register.registrationError'));
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
          <h1 className="text-2xl font-bold text-text-primary">{t('register.title')}</h1>
          <p className="text-text-secondary text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2">
              {success}
              {resendSuccess && <p className="mt-2 text-green-400">{resendSuccess}</p>}
              {requiresVerification && (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="block w-full rounded-lg border border-accent-primary/50 text-accent-primary py-2 text-sm font-medium hover:bg-accent-primary/10 disabled:opacity-50"
                  >
                    {resendLoading ? t('forgotPassword.sending') : t('verifyEmail.resendCode')}
                  </button>
                  <p>
                    <Link to="/login" className="text-accent-primary hover:underline">
                      {t('forgotPassword.backToLogin')}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('register.email')}
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
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('register.password')}
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
            <p className="text-text-muted text-xs mt-1">{t('validation.passwordMinLength')}</p>
          </div>
          <div>
            <label
              htmlFor="referral"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              {t('register.referralCodeOptional')}
            </label>
            <input
              id="referral"
              type="text"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full rounded-lg bg-bg-input border border-border-main text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
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
            {loading ? t('register.creating') : t('register.createAccount')}
          </button>

          <div className="flex items-center gap-3 pt-2">
            <span className="flex-1 h-px bg-border-main" aria-hidden />
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('register.or')}</span>
            <span className="flex-1 h-px bg-border-main" aria-hidden />
          </div>

          <div className="space-y-2">
            <p className="text-center text-xs text-text-muted">{t('register.instantAccountDesc')}</p>
            <button
              type="button"
              onClick={handleInstantAccount}
              disabled={instantLoading || loading}
              className="w-full rounded-lg border-2 border-accent-primary text-accent-primary bg-transparent font-medium py-2.5 hover:bg-accent-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {instantLoading ? t('register.creating') : t('register.instantAccount')}
            </button>
            {referralCode.trim() && (
              <p className="text-[10px] text-center text-text-muted">
                {t('register.referralCodeOptional')}: {referralCode.trim()}
              </p>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-text-secondary">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-accent-primary hover:underline">
            {t('register.signIn')}
          </Link>
        </p>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-primary transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>

      <SuccessRegistrationModal
        show={showSuccessModal}
        apiKey={generatedApiKey}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}
