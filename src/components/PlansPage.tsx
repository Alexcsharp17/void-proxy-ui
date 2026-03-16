import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api';
import type { Product } from '../api/types';
import PlanCard from './PlanCard';

interface PlansPageProps {
  onNavigateToDeposit: () => void;
}

export default function PlansPage({ onNavigateToDeposit }: PlansPageProps) {
  const { t } = useTranslation('app');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError('');
        const data = await productsApi.getProxyProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
        <section>
          <div className="max-w-xl rounded-xl border border-border-main/30 bg-bg-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary mb-1">{t('plans.proxyPlans')}</h3>
              <p className="text-sm text-text-muted mb-4">{t('plans.proxyPlansDesc')}</p>
              <button
                type="button"
                onClick={onNavigateToDeposit}
                className="rounded-lg bg-accent-primary text-white font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
              >
                {t('plans.goToDeposit')}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-8">
        <section>
          <div className="max-w-xl rounded-xl border border-border-main/30 bg-bg-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary mb-1">{t('plans.proxyPlans')}</h3>
              <p className="text-sm text-text-muted mb-4">{t('plans.proxyPlansDesc')}</p>
              <button
                type="button"
                onClick={onNavigateToDeposit}
                className="rounded-lg bg-accent-primary text-white font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
              >
                {t('plans.goToDeposit')}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-12 pb-8">
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {products.map((product, index) => (
            <React.Fragment key={String(product.id)}>
              <PlanCard
                product={product}
                onNavigateToDeposit={onNavigateToDeposit}
                showResellerBadge={false}
              />
            </React.Fragment>
          ))}
        </div>
      </section>

      <div className="mt-20 text-center">
        <p className="text-sm text-text-secondary mb-6 max-w-2xl mx-auto">
          {t('plans.needCustomPlan')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="#"
            className="rounded-full border border-border-main px-6 py-2.5 text-xs font-label uppercase tracking-widest text-text-secondary hover:bg-bg-panel transition-colors"
          >
            {t('plans.documentation')}
          </Link>
          <Link
            to="#"
            className="rounded-full border border-border-main px-6 py-2.5 text-xs font-label uppercase tracking-widest text-text-secondary hover:bg-bg-panel transition-colors"
          >
            {t('plans.supportChat')}
          </Link>
        </div>
      </div>
    </div>
  );
}
