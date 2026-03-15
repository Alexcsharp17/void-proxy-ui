import React from 'react';
import { useTranslation } from 'react-i18next';
import { getApiUrlConfigError } from '../utils/envValidation';

export default function ApiUrlBanner() {
  const { t } = useTranslation('common');
  const error = getApiUrlConfigError();
  if (!error) return null;

  return (
    <div
      className="px-4 py-2 text-center text-sm bg-amber-500/15 text-amber-600 dark:text-amber-400 border-b border-amber-500/30"
      role="alert"
    >
      {t('apiUrlNotConfigured')}
    </div>
  );
}
