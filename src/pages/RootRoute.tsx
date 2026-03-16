import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import App from '../App';
import LandingPage from './LandingPage';

/**
 * Корень "/": для гостей — лендинг, для авторизованных — дашборд (App).
 */
export default function RootRoute() {
  const { t } = useTranslation('app');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary">
        <div className="animate-pulse text-text-secondary text-sm">{t('common.loading')}</div>
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
