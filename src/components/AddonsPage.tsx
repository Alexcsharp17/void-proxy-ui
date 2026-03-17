import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Loader2, CheckCircle, Store, UserPlus, BadgeCheck } from 'lucide-react';
import { productsApi, ordersApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { Product } from '../api/types';

function getLocalized(value: string | { en?: string; ru?: string } | undefined): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value.en ?? value.ru ?? '';
}

function getProductType(p: Product): string {
  const details = p?.productDetails ?? (p as any)?.attributes ?? {};
  return ((details.productType as string) || '').toLowerCase();
}

const RANK_ORDER = ['USER', 'AFFILIATE', 'AFFILIATE_PRO', 'RESELLER'] as const;

export default function AddonsPage() {
  const { t } = useTranslation('app');
  const { user, checkAuth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const list = await productsApi.getAddonProducts();
        if (!cancelled) setProducts(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load add-ons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const speedProduct = products.find((p) => getProductType(p) === 'speed-boost');
  const affiliateProduct = products.find((p) => getProductType(p) === 'affiliate');
  const affiliateProProduct = products.find((p) => getProductType(p) === 'affiliate-pro');
  const resellerProduct = products.find((p) => getProductType(p) === 'reseller-access');

  const isSpeedActive = user?.hasSpeedBoost === true;
  const userRank = user?.userRank ?? 'USER';
  const rankIdx = RANK_ORDER.indexOf(userRank as any) >= 0 ? RANK_ORDER.indexOf(userRank as any) : 0;
  // Reseller (role or userRank) includes Affiliate + Affiliate Pro; higher rank implies lower ranks are owned
  const isResellerActive = user?.role === 'RESELLER' || userRank === 'RESELLER';
  const isAffiliateActive = rankIdx >= RANK_ORDER.indexOf('AFFILIATE');
  const isAffiliateProActive = rankIdx >= RANK_ORDER.indexOf('AFFILIATE_PRO');

  const isAddonOwned = (product: Product): boolean => {
    const type = getProductType(product);
    if (type === 'speed-boost') return isSpeedActive;
    if (type === 'affiliate') return isAffiliateActive;
    if (type === 'affiliate-pro') return isAffiliateProActive;
    if (type === 'reseller-access') return isResellerActive;
    return false;
  };

  const handlePurchase = async (product: Product) => {
    if (isAddonOwned(product)) return;
    const id = typeof product.id === 'string' ? Number(product.id) : product.id;
    const price = product.basePrice ?? 0;
    setPurchasingId(id);
    setSuccessMessage(null);
    setError(null);
    try {
      await ordersApi.createOrder({
        serviceType: 20,
        productId: id,
        quantity: 1,
        price,
        targets: [],
      });
      await checkAuth();
      setSuccessMessage(t('addons.activated'));
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && e.response && typeof e.response === 'object' && 'data' in e.response
        ? (e.response as { data?: { message?: string } }).data?.message
        : e instanceof Error ? e.message : 'Purchase failed';
      setError(msg || t('addons.purchaseFailed'));
    } finally {
      setPurchasingId(null);
    }
  };

  const renderPurchaseButton = (product: Product, label: string, active: boolean, popular?: boolean) => {
    const id = typeof product.id === 'string' ? Number(product.id) : product.id;
    const purchasing = purchasingId === id;
    const price = product.basePrice ?? 0;
    const insufficient = user?.balance != null && user.balance < price;

    if (active) {
      return (
        <div className="w-full py-3 px-4 bg-bg-panel rounded-xl font-bold text-text-muted flex items-center justify-center gap-2 border border-border-main/50 cursor-default">
          <CheckCircle className="h-4 w-4 shrink-0 text-accent-primary" />
          {t('addons.owned')}
        </div>
      );
    }
    return (
      <button
        type="button"
        disabled={purchasing || insufficient}
        onClick={() => handlePurchase(product)}
        className={
          popular
            ? 'w-full py-3 px-4 bg-accent-primary text-bg-main rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(100,138,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            : 'w-full py-3 px-4 border border-border-main rounded-xl font-bold text-sm text-text-primary hover:bg-text-primary hover:text-bg-main transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        }
      >
        {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {insufficient ? t('addons.insufficientBalance') : `${label} — $${price.toFixed(2)}`}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <header className="mb-12">
        <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-text-primary tracking-tight mb-2">
          {t('addons.title')}
        </h2>
        <p className="text-text-muted text-base md:text-lg">
          {t('addons.subtitleFull')}
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Section 1: Speed Upgrade — ref: glass panel, when active show neutral "Active" block */}
      <section className="mb-16">
        <div className="rounded-xl bg-bg-panel/90 backdrop-blur border border-border-main/50 shadow-xl overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-primary/10 blur-[100px] pointer-events-none" aria-hidden />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-headline font-bold text-text-primary">
                    {speedProduct ? getLocalized(speedProduct.displayName ?? speedProduct.name) : t('addons.speedUpgradeTitle')}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {speedProduct ? getLocalized(speedProduct.description) : t('addons.speedUpgradeDesc')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-bg-main/60 rounded-xl border border-border-main/30">
                  <span className="text-xs font-label text-text-muted uppercase tracking-wider block mb-1">{t('addons.current')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-bg-panel text-[10px] text-text-primary uppercase font-bold">Standard</span>
                  <p className="text-xl font-headline font-extrabold text-text-primary mt-1">200 Mbps</p>
                </div>
                <div className="p-4 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                  <span className="text-xs font-label text-accent-primary uppercase tracking-wider block mb-1">{t('addons.upgraded')}</span>
                  <p className="text-xl font-headline font-extrabold text-accent-primary">1000 Mbps</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4 p-6 bg-bg-main/40 rounded-xl border border-border-main/30 shrink-0">
              <div className="text-right">
                <p className="text-xs font-label text-text-muted uppercase tracking-widest mb-1">{t('addons.oneTimeUpgrade')}</p>
                <p className="text-3xl md:text-4xl font-extrabold text-text-primary font-headline">
                  ${(speedProduct?.basePrice ?? 150).toFixed(2)}
                </p>
              </div>
              {!speedProduct ? (
                <span className="text-text-muted text-sm">{t('addons.noAddons')}</span>
              ) : isSpeedActive ? (
                <div className="w-full md:w-auto px-12 py-4 bg-bg-panel text-text-muted font-bold rounded-xl cursor-default border border-border-main flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 text-accent-primary" />
                  {t('addons.active')}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={purchasingId === (typeof speedProduct.id === 'string' ? Number(speedProduct.id) : speedProduct.id) || (user?.balance != null && user.balance < (speedProduct.basePrice ?? 0))}
                  onClick={() => handlePurchase(speedProduct)}
                  className="w-full md:w-auto px-12 py-4 bg-accent-primary text-bg-main font-bold rounded-xl hover:shadow-[0_0_20px_rgba(100,138,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {purchasingId === (typeof speedProduct.id === 'string' ? Number(speedProduct.id) : speedProduct.id) ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {t('addons.upgrade')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Rank Upgrades — Affiliate, Affiliate Pro, Reseller (1:1 reference) */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent-violet/20 flex items-center justify-center">
            <BadgeCheck className="h-6 w-6 text-accent-violet" />
          </div>
          <div>
            <h3 className="text-2xl font-headline font-bold text-text-primary">
              {t('addons.rankUpgrades')}
            </h3>
            <p className="text-sm font-label text-text-muted uppercase tracking-wider">
              {t('addons.currentRank')}: <span className="text-text-primary font-bold">{userRank}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Affiliate Card — when owned show neutral "Owned" block at bottom (ref) */}
          <div className="rounded-xl bg-bg-panel/90 backdrop-blur border border-border-main/50 p-8 flex flex-col hover:bg-bg-panel transition-colors group">
            <div className="mb-6">
              <UserPlus className="h-10 w-10 text-accent-violet mb-2" />
              <h4 className="text-xl font-bold mb-1 text-text-primary">
                {affiliateProduct ? getLocalized(affiliateProduct.displayName ?? affiliateProduct.name) : 'Affiliate'}
              </h4>
              <p className="text-2xl font-headline font-extrabold text-text-primary">
                ${(affiliateProduct?.basePrice ?? 100).toFixed(2)}
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateBenefit1')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateBenefit2')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateBenefit3')}
              </li>
            </ul>
            {affiliateProduct ? renderPurchaseButton(affiliateProduct, t('addons.purchase'), isAffiliateActive) : (
              <button type="button" disabled className="w-full py-3 px-4 border border-border-main rounded-xl font-bold text-sm text-text-muted cursor-not-allowed">
                {t('addons.purchase')} — $100.00
              </button>
            )}
          </div>

          {/* Affiliate Pro Card (Popular) — when owned show "Owned" block */}
          <div className="rounded-xl bg-bg-panel/90 backdrop-blur border border-accent-primary/30 p-8 flex flex-col relative bg-accent-primary/[0.03] group">
            {!isAffiliateProActive && (
              <div className="absolute top-4 right-4 px-2 py-1 bg-accent-primary text-bg-main text-[10px] font-label font-bold rounded uppercase tracking-tighter">
                {t('addons.popular')}
              </div>
            )}
            <div className="mb-6">
              <BadgeCheck className="h-10 w-10 text-accent-primary mb-2" />
              <h4 className="text-xl font-bold mb-1 text-accent-primary">
                {affiliateProProduct ? getLocalized(affiliateProProduct.displayName ?? affiliateProProduct.name) : 'Affiliate Pro'}
              </h4>
              <p className="text-2xl font-headline font-extrabold text-text-primary">
                ${(affiliateProProduct?.basePrice ?? 150).toFixed(2)}
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateProBenefit1')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateProBenefit2')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateProBenefit3')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.affiliateProBenefit4')}
              </li>
            </ul>
            {affiliateProProduct ? renderPurchaseButton(affiliateProProduct, t('addons.purchase'), isAffiliateProActive, true) : (
              <button type="button" disabled className="w-full py-3 px-4 bg-accent-primary/50 text-bg-main rounded-xl font-bold text-sm cursor-not-allowed">
                {t('addons.purchase')} — $150.00
              </button>
            )}
          </div>

          {/* Reseller Card — when owned show "Owned" block */}
          <div className="rounded-xl bg-bg-panel/90 backdrop-blur border border-border-main/50 p-8 flex flex-col hover:bg-bg-panel transition-colors group">
            <div className="mb-6">
              <Store className="h-10 w-10 text-accent-violet mb-2" />
              <h4 className="text-xl font-bold mb-1 text-text-primary">
                {resellerProduct ? getLocalized(resellerProduct.displayName ?? resellerProduct.name) : 'Reseller'}
              </h4>
              <p className="text-2xl font-headline font-extrabold text-text-primary">
                ${(resellerProduct?.basePrice ?? 175).toFixed(2)}
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.resellerBenefit1')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.resellerBenefit2')}
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-accent-primary shrink-0 mt-1" />
                {t('addons.resellerBenefit3')}
              </li>
            </ul>
            {resellerProduct ? renderPurchaseButton(resellerProduct, t('addons.purchase'), isResellerActive) : (
              <button type="button" disabled className="w-full py-3 px-4 border border-border-main rounded-xl font-bold text-sm text-text-muted cursor-not-allowed">
                {t('addons.purchase')} — $175.00
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
