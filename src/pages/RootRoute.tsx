import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import App from '../App';
import LandingPage from './LandingPage';

/**
 * Корень "/": для гостей — лендинг, для авторизованных — дашборд (App).
 * При недоступности API показывается экран «Сервис недоступен» с кнопкой «Повторить».
 */
export default function RootRoute() {
  const { t } = useTranslation('app');
  const { t: tCommon } = useTranslation('common');
  const { isAuthenticated, isLoading, apiUnreachable, retryAuth } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary">
        <div className="animate-pulse text-text-secondary text-sm">{t('common.loading')}</div>
      </div>
    );
  }

  if (apiUnreachable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-primary font-sans p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-text-primary">
            {tCommon('serviceUnavailable')}
          </h1>
          <p className="text-sm text-text-secondary">
            {tCommon('serviceUnavailableDesc')}
          </p>
          <button
            type="button"
            onClick={() => void retryAuth()}
            className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity"
          >
            {tCommon('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  );
}
