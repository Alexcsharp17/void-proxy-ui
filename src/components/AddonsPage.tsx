import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Store, Zap } from 'lucide-react';

export default function AddonsPage() {
  const { t } = useTranslation('app');

  const addons = [
    {
      key: 'reseller' as const,
      icon: Store,
      titleKey: 'addons.resellerTitle' as const,
      descKey: 'addons.resellerDesc' as const,
    },
    {
      key: 'premium' as const,
      icon: Zap,
      titleKey: 'addons.premiumTitle' as const,
      descKey: 'addons.premiumDesc' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          {addons.map(({ key, icon: Icon, titleKey, descKey }) => (
            <div
              key={key}
              className="flex gap-4 p-5 rounded-xl bg-bg-panel border border-border-main/30 hover:border-accent-primary/30 transition-colors"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text-primary mb-1">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-text-muted">
                  {t(descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
