import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-primary font-sans p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold text-text-primary">
          {t('pageNotFound')}
        </h1>
        <p className="text-sm text-text-secondary">
          {t('pageNotFoundDesc')}
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity"
        >
          {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
