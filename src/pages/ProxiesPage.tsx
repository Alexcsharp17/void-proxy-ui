import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Zap, Layers, ChevronDown, Loader2, Box } from 'lucide-react';
import { productsApi } from '../api';
import type { Product } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

const useCasesKeys = [
  'accountCreation',
  'automationBots',
  'marketingGrowth',
  'bypassGeo',
  'ecommerce',
  'dataCollection',
] as const;

const faqKeys = [
  'whatToChoose',
  'threads',
  'customize',
  'protocols',
  'logs',
  'refunds',
  'countries',
  'tryBefore',
] as const;

function getProductDisplayName(p: Product): string {
  const name = p.displayName ?? p.name;
  return typeof name === 'string' ? name : (name as { en?: string })?.en ?? '';
}

export default function ProxiesPage() {
  const { t } = useTranslation('app');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
    return () => { cancelled = true; };
  }, []);

  const handleOrderClick = (productId: number | string) => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    const path = `/login?redirect=${encodeURIComponent('/proxies')}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      {/* Public header */}
      <header className="sticky top-0 z-50 border-b border-border-main bg-bg-main/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center text-text-primary hover:opacity-90 transition-opacity">
            <img src="/void.svg" alt="Void" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-accent-primary text-bg-main text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t('proxiesPage.order')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  {t('proxiesPage.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-accent-primary text-bg-main text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('proxiesPage.signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Hero */}
        <section className="text-center mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
            {t('proxiesPage.heroTitle')}
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
              {t('proxiesPage.badges.datacenter')}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {t('proxiesPage.badges.residential')}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {t('proxiesPage.badges.unlimited')}
            </span>
          </div>
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
            {t('proxiesPage.heroSubtitle')}
          </p>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 lg:mb-20">
          {[
            { key: 'wideCountrySelection', icon: Globe, color: 'text-emerald-400' },
            { key: 'fullCustomization', icon: Layers, color: 'text-blue-400' },
            { key: 'highSpeedAutomation', icon: Zap, color: 'text-pink-400' },
          ].map(({ key, icon: Icon, color }) => (
            <div
              key={key}
              className="rounded-2xl border border-border-main bg-bg-panel/60 p-6 text-center"
            >
              <Icon className={`w-9 h-9 mx-auto mb-4 ${color}`} />
              <h3 className="text-sm font-bold text-text-primary mb-2">
                {t(`proxiesPage.features.${key}.title`)}
              </h3>
              <p className="text-xs text-text-secondary">
                {t(`proxiesPage.features.${key}.description`)}
              </p>
            </div>
          ))}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 lg:mb-20">
          <div className="rounded-2xl border border-border-main bg-bg-panel/40 p-6 text-center">
            <p className="text-2xl font-bold text-accent-primary mb-1">99.9%+</p>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              {t('proxiesPage.stats.uptime')}
            </p>
          </div>
          <div className="rounded-2xl border border-border-main bg-bg-panel/40 p-6 text-center">
            <p className="text-2xl font-bold text-accent-primary mb-1">100+</p>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              {t('proxiesPage.stats.countries')}
            </p>
          </div>
          <div className="rounded-2xl border border-border-main bg-bg-panel/40 p-6 text-center">
            <p className="text-2xl font-bold text-accent-primary mb-1">
              {t('proxiesPage.stats.speedFrom', { speed: 500 })}
            </p>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              {t('proxiesPage.stats.throughput')}
            </p>
          </div>
        </section>

        {/* Pricing / Product cards */}
        <section id="proxy-cards" className="mb-16 lg:mb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-8 text-center">
            {t('proxiesPage.selectPackage')}
          </h2>
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 text-sm p-4 mb-8 text-center">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{t('proxiesPage.loading')}</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-border-main bg-bg-panel/40">
              <Box className="w-12 h-12 mx-auto text-text-muted/50 mb-4" />
              <h3 className="text-sm font-bold text-text-primary mb-2">
                {t('proxiesPage.noProxies')}
              </h3>
              <p className="text-xs text-text-secondary">
                {t('proxiesPage.noProxiesDescription')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={String(product.id)}
                  className="rounded-2xl border border-border-main bg-bg-panel/60 p-6 flex flex-col"
                >
                  <h3 className="text-sm font-bold text-text-primary mb-2">
                    {getProductDisplayName(product)}
                  </h3>
                  {product.basePrice != null && product.basePrice > 0 && (
                    <p className="text-xs text-text-secondary mb-4">
                      from ${Number(product.basePrice).toFixed(2)}
                      {product.displayUnit ? ` / ${product.displayUnit}` : ''}
                    </p>
                  )}
                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => handleOrderClick(product.id)}
                      className="w-full py-2.5 rounded-xl bg-accent-primary text-bg-main text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {isAuthenticated
                        ? t('proxiesPage.order')
                        : t('proxiesPage.signInToOrder')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Use cases */}
        <section className="mb-16 lg:mb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-8 text-center">
            {t('proxiesPage.useCasesTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCasesKeys.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-border-main bg-bg-panel/40 p-6"
              >
                <h3 className="text-sm font-bold text-text-primary mb-2">
                  {t(`proxiesPage.useCases.${key}.title`)}
                </h3>
                <p className="text-xs text-text-secondary">
                  {t(`proxiesPage.useCases.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-8 text-center">
            {t('proxiesPage.faqTitle')}
          </h2>
          <div className="space-y-2 max-w-3xl mx-auto">
            {faqKeys.map((key) => (
              <details
                key={key}
                className="group rounded-xl border border-border-main bg-bg-panel/40 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer list-none text-left hover:bg-bg-panel/60 transition-colors">
                  <h4 className="text-sm font-bold text-text-primary">
                    {t(`proxiesPage.faq.${key}.question`)}
                  </h4>
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-3 pt-0 text-xs text-text-secondary border-t border-border-main/50">
                  {t(`proxiesPage.faq.${key}.answer`)}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
