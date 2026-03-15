import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation('app');
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-primary">
        <div className="animate-pulse text-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentPath = location.pathname + location.search;
    const redirectUrl = currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
    return <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}
