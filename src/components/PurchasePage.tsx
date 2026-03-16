import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Package, Sliders, RefreshCw, ArrowRight, Info, Pencil, Gauge, Zap, Rocket } from 'lucide-react';
import { setPurchaseSegment } from '../store/slices/appSlice';
import { productsApi, promoApi } from '../api';
import type { Product, PricingTableEntry, PricingTableResponse, PricingModifiersResponse } from '../api/types';
import type { PromoCodeDto } from '../api/promo.api';
import { calculateBulkDiscount } from '../utils/bulkDiscount';

const BYTES_PER_GB = 1e9;
const DEFAULT_SLIDER_MIN = 1;
const DEFAULT_SLIDER_MAX = 10000;

/** Supplementary (quick-option) packages not from API — fixed labels and prices. */
const SUPPLEMENTARY_PACKAGES = [
  { labelKey: 'purchase.supplementaryTrial', gb: 10, totalPrice: 3 },
  { labelKey: 'purchase.supplementaryStarter', gb: 50, totalPrice: 15 },
  { labelKey: 'purchase.supplementaryProfessional', gb: 100, totalPrice: 30 },
  { labelKey: 'purchase.supplementaryBusiness', gb: 250, totalPrice: 75 },
  { labelKey: 'purchase.supplementaryEnterprise', gb: 500, totalPrice: 147.63 },
] as const;

/** Build quick packages from pricing table (base entries only, no modifier). */
function buildQuickPackagesFromTable(
  table: PricingTableEntry[],
  productId: number | string
): { gb: number; pricePerGb: number; popular: boolean; entry: PricingTableEntry }[] {
  const baseEntries = table.filter(
    (e) => e.productId === Number(productId) && !e.modifierTier && !e.modifier
  );
  if (baseEntries.length === 0) return [];

  const out: { gb: number; pricePerGb: number; popular: boolean; entry: PricingTableEntry }[] = [];
  for (let i = 0; i < Math.min(5, baseEntries.length); i++) {
    const e = baseEntries[i];
    const gb = e.quantity >= 1e6 ? e.quantity / BYTES_PER_GB : e.quantity;
    const pricePerGb = e.basePrice ?? e.totalPrice ?? 0;
    out.push({
      gb: Math.round(gb),
      pricePerGb,
      popular: i === 1,
      entry: e,
    });
  }
  return out;
}

/** Find best matching tier for a given GB (last tier's basePrice and minGB for bulk discount). */
function findTierForGb(
  table: PricingTableEntry[],
  gb: number,
  productId: number | string
): { basePrice: number; lastPackageMinGB: number } | null {
  const baseEntries = table
    .filter((e) => e.productId === Number(productId) && !e.modifierTier && !e.modifier)
    .map((e) => ({
      ...e,
      gb: e.quantity >= 1e6 ? e.quantity / BYTES_PER_GB : e.quantity,
    }))
    .sort((a, b) => a.gb - b.gb);
  if (baseEntries.length === 0) return null;
  const last = baseEntries[baseEntries.length - 1];
  const basePrice = last.basePrice ?? last.totalPrice ?? 0;
  const lastPackageMinGB = last.gb;
  return { basePrice, lastPackageMinGB };
}

/** Get product attributes for bulk discount params. */
function getBulkAttrs(product: Product | null): {
  bulkDiscountMaxPercent?: number;
  bulkDiscountCoefficient?: number;
  bulkDiscountExponent?: number;
} {
  const attrs = (product as any)?.attributes ?? (product as any)?.productDetails ?? {};
  return {
    bulkDiscountMaxPercent: typeof attrs.bulkDiscountMaxPercent === 'number' ? attrs.bulkDiscountMaxPercent : undefined,
    bulkDiscountCoefficient: typeof attrs.bulkDiscountCoefficient === 'number' ? attrs.bulkDiscountCoefficient : undefined,
    bulkDiscountExponent: typeof attrs.bulkDiscountExponent === 'number' ? attrs.bulkDiscountExponent : undefined,
  };
}

function isUnlimitedProduct(p: Product): boolean {
  const attrs = (p as any)?.attributes ?? (p as any)?.productDetails ?? {};
  return attrs?.technical?.isUnlimited === true || (p as any)?.proxyType === 'unlimited';
}

/** Unique duration options from unlimited pricing table (quantity in seconds, quantityDisplay). */
function buildUnlimitedDurations(table: PricingTableEntry[], productId: number | string): { quantity: number; quantityDisplay: string }[] {
  const byProduct = table.filter((e) => e.productId === Number(productId));
  const seen = new Set<number>();
  const out: { quantity: number; quantityDisplay: string }[] = [];
  for (const e of byProduct) {
    if (seen.has(e.quantity)) continue;
    seen.add(e.quantity);
    out.push({ quantity: e.quantity, quantityDisplay: e.quantityDisplay || `${e.quantity}s` });
  }
  out.sort((a, b) => a.quantity - b.quantity);
  return out;
}

/** Speed options from modifiers (SPEED) or from table entries (unique modifier tier + label). */
function buildUnlimitedSpeedOptions(
  modifiers: PricingModifiersResponse | null,
  table: PricingTableEntry[],
  productId: number | string
): { level: number; label: string; speedMbps?: number; popular?: boolean }[] {
  if (modifiers?.SPEED?.levels?.length) {
    return modifiers.SPEED.levels.map((l, i) => ({
      level: l.value,
      label: l.label || `${l.metadata?.speed ?? l.value} Mbps`,
      speedMbps: l.metadata?.speed ?? undefined,
      popular: i === 1,
    }));
  }
  const byProduct = table.filter((e) => e.productId === Number(productId) && (e.modifierTier != null || e.modifier != null));
  const seen = new Set<number>();
  const out: { level: number; label: string; speedMbps?: number; popular?: boolean }[] = [];
  for (const e of byProduct) {
    const level = e.modifier?.level ?? e.modifierTier ?? 0;
    if (level === 0 || seen.has(level)) continue;
    seen.add(level);
    const label = e.modifier?.label ?? (e.modifier?.speed ? `${e.modifier.speed} Mbps` : `Tier ${level}`);
    out.push({ level, label, speedMbps: e.modifier?.speed ?? e.speedMbps, popular: false });
  }
  out.sort((a, b) => a.level - b.level);
  if (out.length > 1) out[1].popular = true;
  return out;
}

function findUnlimitedPrice(
  table: PricingTableEntry[],
  productId: number | string,
  quantitySeconds: number,
  modifierLevel: number
): number | null {
  const e = table.find(
    (x) =>
      x.productId === Number(productId) &&
      x.quantity === quantitySeconds &&
      (x.modifierTier === modifierLevel || x.modifier?.level === modifierLevel)
  );
  return e ? (e.totalPrice ?? e.basePrice) : null;
}

interface PurchasePageProps {
  onNavigateToDeposit: () => void;
}

export default function PurchasePage({ onNavigateToDeposit }: PurchasePageProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation('app');
  const [segment, setSegment] = useState<'gb' | 'unlimited'>('gb');
  useEffect(() => {
    dispatch(setPurchaseSegment(segment));
  }, [segment, dispatch]);
  const [selectedQuickIndex, setSelectedQuickIndex] = useState<number | null>(1);
  const [selectedSupplementaryIndex, setSelectedSupplementaryIndex] = useState<number | null>(null);
  const [customGb, setCustomGb] = useState(50);
  const [customGbInput, setCustomGbInput] = useState('50');
  const [autoReplenish, setAutoReplenish] = useState(true);
  const [thresholdGb, setThresholdGb] = useState(5);
  const [refillGb, setRefillGb] = useState(20);

  const [products, setProducts] = useState<Product[]>([]);
  const [pricingTable, setPricingTable] = useState<PricingTableResponse | null>(null);
  const [unlimitedPricingTable, setUnlimitedPricingTable] = useState<PricingTableResponse | null>(null);
  const [unlimitedModifiers, setUnlimitedModifiers] = useState<PricingModifiersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [unlimitedDurationIndex, setUnlimitedDurationIndex] = useState(0);
  const [unlimitedSpeedIndex, setUnlimitedSpeedIndex] = useState(1);

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeDto | null>(null);
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null);

  const gbProduct = useMemo(() => {
    const list = products.filter((p) => {
      const du = (p as any).displayUnit ?? (p as any).baseUnit;
      const st = Number(p.serviceType);
      return du === 'GB' || st === 17;
    });
    return list[0] ?? products[0] ?? null;
  }, [products]);

  const unlimitedProduct = useMemo(() => products.find(isUnlimitedProduct) ?? null, [products]);

  const tableEntries = useMemo(() => {
    if (!pricingTable?.products?.length) return [];
    const byId = pricingTable.products.find(
      (p) => Number(p.productId) === Number(gbProduct?.id)
    );
    return byId?.pricingTable ?? [];
  }, [pricingTable, gbProduct?.id]);

  const unlimitedTableEntries = useMemo(() => {
    if (!unlimitedPricingTable?.products?.length) return [];
    const byId = unlimitedPricingTable.products.find(
      (p) => Number(p.productId) === Number(unlimitedProduct?.id)
    );
    return byId?.pricingTable ?? [];
  }, [unlimitedPricingTable, unlimitedProduct?.id]);

  const unlimitedDurationOptions = useMemo(
    () => buildUnlimitedDurations(unlimitedTableEntries, unlimitedProduct?.id ?? 0),
    [unlimitedTableEntries, unlimitedProduct?.id]
  );

  const unlimitedSpeedOptions = useMemo(
    () => buildUnlimitedSpeedOptions(unlimitedModifiers, unlimitedTableEntries, unlimitedProduct?.id ?? 0),
    [unlimitedModifiers, unlimitedTableEntries, unlimitedProduct?.id]
  );

  const unlimitedPrice = useMemo(() => {
    if (!unlimitedProduct?.id || unlimitedDurationOptions.length === 0 || unlimitedSpeedOptions.length === 0) return null;
    const dur = unlimitedDurationOptions[unlimitedDurationIndex];
    const speed = unlimitedSpeedOptions[unlimitedSpeedIndex];
    if (!dur || !speed) return null;
    return findUnlimitedPrice(unlimitedTableEntries, unlimitedProduct.id, dur.quantity, speed.level);
  }, [unlimitedProduct?.id, unlimitedTableEntries, unlimitedDurationOptions, unlimitedSpeedOptions, unlimitedDurationIndex, unlimitedSpeedIndex]);

  const unlimitedNetworkFee = 0;
  const unlimitedTotal = (unlimitedPrice ?? 0) + unlimitedNetworkFee;

  const sliderMin = (gbProduct as any)?.minOrderAmount ?? DEFAULT_SLIDER_MIN;
  const sliderMax = (gbProduct as any)?.maxOrderAmount ?? DEFAULT_SLIDER_MAX;

  const quickPackages = useMemo(() => {
    if (!gbProduct || tableEntries.length === 0)
      return [
        { gb: 10, pricePerGb: 3.5, popular: false },
        { gb: 50, pricePerGb: 3.2, popular: true },
        { gb: 100, pricePerGb: 2.8, popular: false },
        { gb: 250, pricePerGb: 2.5, popular: false },
        { gb: 500, pricePerGb: 2.1, popular: false },
      ];
    return buildQuickPackagesFromTable(tableEntries, gbProduct.id);
  }, [gbProduct, tableEntries]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const list = await productsApi.getProxyProducts();
        if (cancelled) return;
        setProducts(list);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!gbProduct?.id) {
      setPricingTable(null);
      return;
    }
    let cancelled = false;
    productsApi.getPricingTable(gbProduct.id).then((table) => {
      if (!cancelled) setPricingTable(table);
    }).catch(() => {
      if (!cancelled) setPricingTable(null);
    });
    return () => { cancelled = true; };
  }, [gbProduct?.id]);

  useEffect(() => {
    if (!unlimitedProduct?.id) {
      setUnlimitedPricingTable(null);
      setUnlimitedModifiers(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      productsApi.getPricingTable(unlimitedProduct.id),
      productsApi.getPricingModifiers(unlimitedProduct.id),
    ]).then(([table, modifiers]) => {
      if (!cancelled) {
        setUnlimitedPricingTable(table);
        setUnlimitedModifiers(modifiers ?? null);
      }
    }).catch(() => {
      if (!cancelled) {
        setUnlimitedPricingTable(null);
        setUnlimitedModifiers(null);
      }
    });
    return () => { cancelled = true; };
  }, [unlimitedProduct?.id]);

  useEffect(() => {
    if (unlimitedDurationOptions.length > 0 && unlimitedDurationIndex >= unlimitedDurationOptions.length)
      setUnlimitedDurationIndex(0);
    if (unlimitedSpeedOptions.length > 0 && unlimitedSpeedIndex >= unlimitedSpeedOptions.length)
      setUnlimitedSpeedIndex(Math.min(1, unlimitedSpeedOptions.length - 1));
  }, [unlimitedDurationOptions.length, unlimitedSpeedOptions.length, unlimitedDurationIndex, unlimitedSpeedIndex]);

  useEffect(() => {
    const min = (gbProduct as any)?.minOrderAmount ?? DEFAULT_SLIDER_MIN;
    const max = (gbProduct as any)?.maxOrderAmount ?? DEFAULT_SLIDER_MAX;
    setCustomGb((prev) => Math.min(max, Math.max(min, prev)));
    setCustomGbInput((prev) => {
      const n = parseInt(prev, 10);
      if (Number.isNaN(n)) return String(min);
      return String(Math.min(max, Math.max(min, n)));
    });
  }, [gbProduct?.id]);

  const clampGb = (n: number) => Math.min(sliderMax, Math.max(sliderMin, n));
  const effectiveCustomGb = (() => {
    const parsed = parseInt(customGbInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) return clampGb(parsed);
    return customGb;
  })();

  const displayVolume =
    selectedSupplementaryIndex != null
      ? SUPPLEMENTARY_PACKAGES[selectedSupplementaryIndex].gb
      : selectedQuickIndex != null
        ? quickPackages[selectedQuickIndex]?.gb ?? customGb
        : effectiveCustomGb;

  const { total, pricePerGb: displayPricePerGb, volumeDiscount } = useMemo(() => {
    const gb = displayVolume;
    if (selectedSupplementaryIndex != null && SUPPLEMENTARY_PACKAGES[selectedSupplementaryIndex]) {
      const pkg = SUPPLEMENTARY_PACKAGES[selectedSupplementaryIndex];
      const totalPrice = pkg.totalPrice;
      return {
        total: totalPrice,
        pricePerGb: totalPrice / pkg.gb,
        volumeDiscount: 0,
      };
    }
    if (selectedQuickIndex != null && quickPackages[selectedQuickIndex]) {
      const pkg = quickPackages[selectedQuickIndex];
      const subtotal = pkg.gb * pkg.pricePerGb;
      return {
        total: subtotal,
        pricePerGb: pkg.pricePerGb,
        volumeDiscount: 0,
      };
    }
    if (!gbProduct || tableEntries.length === 0) {
      const fallbackPerGb = gb >= 500 ? 2.1 : gb >= 250 ? 2.5 : gb >= 100 ? 2.8 : gb >= 50 ? 3.2 : 3.5;
      const subtotal = gb * fallbackPerGb;
      const volDiscount = gb >= 50 ? Math.round((gb * 3.5 - subtotal) * 100) / 100 : 0;
      return { total: Math.max(0, subtotal - volDiscount), pricePerGb: fallbackPerGb, volumeDiscount: volDiscount };
    }
    const tier = findTierForGb(tableEntries, gb, gbProduct.id);
    if (!tier || tier.basePrice <= 0) {
      const fallbackPerGb = 3.2;
      return { total: gb * fallbackPerGb, pricePerGb: fallbackPerGb, volumeDiscount: 0 };
    }
    const attrs = getBulkAttrs(gbProduct);
    const bulk = calculateBulkDiscount({
      selectedGB: gb,
      lastPackageMinGB: tier.lastPackageMinGB,
      basePrice: tier.basePrice,
      ...attrs,
    });
    const subtotalNoDiscount = gb * tier.basePrice;
    const discount = Math.round((subtotalNoDiscount - bulk.totalCost) * 100) / 100;
    return {
      total: bulk.totalCost,
      pricePerGb: bulk.pricePerGBWithDiscount,
      volumeDiscount: discount > 0 ? discount : 0,
    };
  }, [displayVolume, selectedQuickIndex, selectedSupplementaryIndex, quickPackages, gbProduct, tableEntries]);

  const currentTotal = segment === 'unlimited' ? unlimitedTotal : total;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError(t('purchase.promoPleaseEnter'));
      return;
    }
    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(null);
    try {
      const validateRes = await promoApi.validate(code);
      if (!validateRes.isValid || !validateRes.promoCode) {
        setPromoError(validateRes.error || t('purchase.promoInvalid'));
        return;
      }
      const applyRes = await promoApi.apply(validateRes.promoCode.code, currentTotal);
      setAppliedPromo(validateRes.promoCode);
      setDiscountedTotal(applyRes.discountedPrice);
      setPromoSuccess(t('purchase.promoApplied'));
      setPromoInput('');
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : t('purchase.promoFailed'));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountedTotal(null);
    setPromoError(null);
    setPromoSuccess(null);
    setPromoInput('');
  };

  useEffect(() => {
    if (!appliedPromo || currentTotal <= 0) return;
    promoApi.apply(appliedPromo.code, currentTotal).then((res) => setDiscountedTotal(res.discountedPrice)).catch(() => {});
  }, [currentTotal, appliedPromo?.code]);

  const productDisplayName = useMemo(() => {
    if (!gbProduct) return t('purchase.serviceTypeValue');
    const name = (gbProduct as any).displayName ?? gbProduct.name;
    return typeof name === 'string' ? name : (name?.en ?? name?.ru ?? t('purchase.serviceTypeValue'));
  }, [gbProduct, t]);

  const sliderFillPercent =
    sliderMax > sliderMin
      ? ((displayVolume - sliderMin) / (sliderMax - sliderMin)) * 100
      : 0;

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <section className="inline-flex p-1.5 rounded-xl bg-bg-input border border-border-main/30 w-full md:w-auto mb-8">
        <button
          type="button"
          onClick={() => setSegment('gb')}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
            segment === 'gb' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {t('purchase.gbProxies')}
        </button>
        <button
          type="button"
          onClick={() => setSegment('unlimited')}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
            segment === 'unlimited' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {t('purchase.unlimitedProxies')}
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-8 space-y-10 w-full">
          {segment === 'gb' && (
            <>
              <section className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-text-primary flex items-center gap-3">
                    <Package className="w-5 h-5 text-accent-primary" />
                    {t('purchase.quickSelection')}
                  </h2>
                  <span className="text-[10px] font-label text-text-muted bg-bg-panel px-3 py-1 rounded-full border border-border-main/30">
                    {t('purchase.saveUpTo')}
                  </span>
                </div>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                    {[10, 50, 100, 250, 500].map((gb) => (
                      <div key={gb} className="bg-bg-panel border border-border-main/30 p-5 rounded-xl animate-pulse h-[120px]" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                      {quickPackages.map((pkg, idx) => {
                        const selected = selectedQuickIndex === idx && selectedSupplementaryIndex == null;
                        return (
                          <div
                            key={`api-${pkg.gb}-${idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedQuickIndex(idx);
                              setSelectedSupplementaryIndex(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && (setSelectedQuickIndex(idx), setSelectedSupplementaryIndex(null))}
                            className={`relative p-5 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all border ${
                              selected ? 'bg-bg-panel border-accent-primary/60 ring-1 ring-accent-primary/20' : 'bg-bg-panel border-border-main/30 hover:border-accent-primary/40'
                            }`}
                          >
                            {pkg.popular && (
                              <div className="absolute top-0 right-0 bg-accent-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                {t('purchase.popular')}
                              </div>
                            )}
                            <span className="text-xl font-bold text-text-primary mb-1">{pkg.gb}GB</span>
                            <span className="text-[10px] font-label text-text-muted mb-4">${pkg.pricePerGb.toFixed(2)} / GB</span>
                            <span className={`w-full py-2 text-xs font-bold rounded-lg ${selected ? 'bg-accent-primary text-white' : 'bg-bg-panel text-text-secondary'}`}>
                              {selected ? t('purchase.selected') : t('purchase.select')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6">
                      <p className="text-xs font-label text-text-muted uppercase tracking-wider mb-3">{t('purchase.supplementaryPackages')}</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                        {SUPPLEMENTARY_PACKAGES.map((pkg, idx) => {
                          const selected = selectedSupplementaryIndex === idx;
                          const pricePerGb = pkg.totalPrice / pkg.gb;
                          return (
                            <div
                              key={`sup-${pkg.gb}-${idx}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedSupplementaryIndex(idx);
                                setSelectedQuickIndex(null);
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && (setSelectedSupplementaryIndex(idx), setSelectedQuickIndex(null))}
                              className={`relative p-5 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all border ${
                                selected ? 'bg-bg-panel border-accent-primary/60 ring-1 ring-accent-primary/20' : 'bg-bg-panel border-border-main/30 hover:border-accent-primary/40'
                              }`}
                            >
                              <span className="text-sm font-semibold text-text-primary mb-1">{t(pkg.labelKey)}</span>
                              <span className="text-xl font-bold text-text-primary mb-0.5">{pkg.gb} GB</span>
                              <span className="text-sm font-medium text-accent-primary mb-1">${pkg.totalPrice.toFixed(2)}</span>
                              <span className="text-[10px] font-label text-text-muted mb-4">${pricePerGb.toFixed(2)}/GB</span>
                              <span className={`w-full py-2 text-xs font-bold rounded-lg ${selected ? 'bg-accent-primary text-white' : 'bg-bg-panel text-text-secondary'}`}>
                                {selected ? t('purchase.selected') : t('purchase.select')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-accent-primary" />
                  {t('purchase.customVolume')}
                </h2>
                <div className="bg-bg-panel border border-border-main/30 p-6 rounded-xl flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex justify-between text-[10px] font-label text-text-muted">
                      <span>{t('purchase.minGb', { min: sliderMin })}</span>
                      <span>{t('purchase.maxGb', { max: sliderMax })}</span>
                    </div>
                    <div className="purchase-slider-wrap">
                      <div
                        className="purchase-slider-fill"
                        style={{ width: `${Math.min(100, Math.max(0, sliderFillPercent))}%` }}
                      />
                      <input
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        value={displayVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setSelectedQuickIndex(null);
                          setSelectedSupplementaryIndex(null);
                          setCustomGb(v);
                          setCustomGbInput(String(v));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center bg-bg-input px-4 py-2.5 rounded-xl border border-border-main/30">
                    <input
                      type="number"
                      min={sliderMin}
                      max={sliderMax}
                      placeholder="0"
                      value={
                        selectedSupplementaryIndex != null
                          ? String(SUPPLEMENTARY_PACKAGES[selectedSupplementaryIndex].gb)
                          : selectedQuickIndex != null
                            ? String(quickPackages[selectedQuickIndex]?.gb ?? customGb)
                            : customGbInput
                      }
                      onChange={(e) => {
                        setSelectedQuickIndex(null);
                        setSelectedSupplementaryIndex(null);
                        setCustomGbInput(e.target.value);
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n) && n >= 1) setCustomGb(clampGb(n));
                      }}
                      onBlur={() => {
                        const n = parseInt(customGbInput, 10);
                        if (Number.isNaN(n) || n < sliderMin) {
                          setCustomGbInput(String(sliderMin));
                          setCustomGb(sliderMin);
                        } else if (n > sliderMax) {
                          setCustomGbInput(String(sliderMax));
                          setCustomGb(sliderMax);
                        } else {
                          setCustomGbInput(String(n));
                          setCustomGb(n);
                        }
                      }}
                      onFocus={() => {
                        if (selectedSupplementaryIndex != null)
                          setCustomGbInput(String(SUPPLEMENTARY_PACKAGES[selectedSupplementaryIndex].gb));
                        else if (selectedQuickIndex != null)
                          setCustomGbInput(String(quickPackages[selectedQuickIndex]?.gb ?? customGb));
                      }}
                      className="bg-transparent border-none text-2xl font-bold text-center w-20 text-text-primary focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] font-label text-text-muted uppercase ml-2">GB</span>
                  </div>
                </div>
              </section>

              <div className="bg-bg-panel border border-border-main/30 p-6 rounded-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-accent-secondary" />
                    <h3 className="font-semibold text-text-primary">{t('purchase.autoReplenish')}</h3>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoReplenish}
                    onClick={() => setAutoReplenish((v) => !v)}
                    className={`relative w-11 h-6 rounded-full border transition-colors shrink-0 ${
                      autoReplenish ? 'bg-accent-primary border-accent-primary' : 'bg-bg-input border-border-main/30'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoReplenish ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {autoReplenish && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-input rounded-xl border border-border-main/20">
                      <p className="text-[10px] font-label text-text-muted mb-2">{t('purchase.threshold')}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-text-primary">{t('purchase.thresholdValue', { gb: thresholdGb })}</span>
                        <Pencil className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                    <div className="p-4 bg-bg-input rounded-xl border border-border-main/20">
                      <p className="text-[10px] font-label text-text-muted mb-2">{t('purchase.refillAmount')}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-text-primary">{t('purchase.refillValue', { gb: refillGb })}</span>
                        <Pencil className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {segment === 'unlimited' && (
            <>
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-label uppercase tracking-widest text-accent-primary font-bold bg-accent-primary/10 px-2 py-1 rounded">
                    {t('purchase.unlimitedStep01')}
                  </span>
                  <h2 className="text-xl font-semibold text-text-primary">{t('purchase.unlimitedServiceDuration')}</h2>
                </div>
                {loading || !unlimitedProduct ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {unlimitedDurationOptions.map((opt, idx) => {
                      const selected = unlimitedDurationIndex === idx;
                      return (
                        <button
                          key={`${opt.quantity}-${idx}`}
                          type="button"
                          onClick={() => setUnlimitedDurationIndex(idx)}
                          className={`py-4 px-6 rounded-xl text-center font-medium border transition-all bg-bg-panel ${
                            selected
                              ? 'border-2 border-accent-primary bg-accent-primary/5 text-accent-primary'
                              : 'border border-border-main/30 text-text-muted hover:text-text-primary hover:border-accent-primary/50'
                          }`}
                        >
                          {opt.quantityDisplay}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-label uppercase tracking-widest text-accent-primary font-bold bg-accent-primary/10 px-2 py-1 rounded">
                    {t('purchase.unlimitedStep02')}
                  </span>
                  <h2 className="text-xl font-semibold text-text-primary">{t('purchase.unlimitedSpeedSelection')}</h2>
                </div>
                {loading || !unlimitedProduct ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card rounded-xl p-6 h-48 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {unlimitedSpeedOptions.map((opt, idx) => {
                      const selected = unlimitedSpeedIndex === idx;
                      const duration = unlimitedDurationOptions[unlimitedDurationIndex];
                      const price =
                        duration && unlimitedProduct?.id
                          ? findUnlimitedPrice(unlimitedTableEntries, unlimitedProduct.id, duration.quantity, opt.level)
                          : null;
                      const SpeedIcon = idx === 0 ? Gauge : idx === 1 ? Zap : Rocket;
                      return (
                        <div
                          key={`speed-${opt.level}-${idx}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setUnlimitedSpeedIndex(idx)}
                          onKeyDown={(e) => e.key === 'Enter' && setUnlimitedSpeedIndex(idx)}
                          className={`relative rounded-xl p-6 flex flex-col justify-between border cursor-pointer transition-colors ${
                            selected
                              ? 'border-2 border-accent-primary/50 bg-accent-primary/5'
                              : 'bg-bg-panel border border-border-main/30 hover:border-accent-primary/40'
                          }`}
                        >
                          {opt.popular && (
                            <div className="absolute top-0 right-0 bg-accent-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                              {t('purchase.popular')}
                            </div>
                          )}
                          <div className="relative">
                            <SpeedIcon className={`w-8 h-8 mb-4 ${selected ? 'text-accent-primary' : 'text-accent-primary/80'}`} />
                            <h3 className="text-xl font-bold text-text-primary mb-2">{opt.label}</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                              {t(`purchase.unlimitedSpeedDesc${Math.min(idx, 2)}`)}
                            </p>
                          </div>
                          <div className="pt-6 border-t border-border-main/20 mt-4">
                            <span className={`text-xl font-bold ${selected ? 'text-accent-primary' : 'text-text-primary'}`}>
                              ${price != null ? price.toFixed(2) : '—'}
                            </span>
                            <span className="text-sm text-text-muted">
                              {duration ? ` / ${duration.quantityDisplay}` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-bg-panel border border-border-main/30 p-6 rounded-xl space-y-6 border-t-2 border-t-accent-primary/50">
            <h2 className="text-lg font-bold text-text-primary">{t('purchase.orderSummary')}</h2>
            {segment === 'unlimited' ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between py-3 border-b border-border-main/20">
                    <span className="text-sm text-text-muted">{t('purchase.unlimitedProduct')}</span>
                    <span className="text-sm font-medium text-text-primary">{t('purchase.unlimitedProductName')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border-main/20">
                    <span className="text-sm text-text-muted">{t('purchase.unlimitedSpeedProfile')}</span>
                    <span className="text-sm font-medium text-accent-primary">
                      {unlimitedSpeedOptions[unlimitedSpeedIndex]?.label ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border-main/20">
                    <span className="text-sm text-text-muted">{t('purchase.unlimitedDuration')}</span>
                    <span className="text-sm font-medium text-text-primary">
                      {unlimitedDurationOptions[unlimitedDurationIndex]?.quantityDisplay ?? '—'}
                    </span>
                  </div>
                  {unlimitedNetworkFee > 0 && (
                    <div className="flex justify-between py-3 border-b border-border-main/20">
                      <span className="text-sm text-text-muted">{t('purchase.unlimitedNetworkFee')}</span>
                      <span className="text-sm font-medium text-text-primary">${unlimitedNetworkFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border-main/20">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-label text-text-muted uppercase">{t('purchase.totalCost')}</span>
                    <div className="text-right">
                      {appliedPromo && discountedTotal != null && discountedTotal < unlimitedTotal && (
                        <span className="block text-xs text-text-muted line-through">${unlimitedTotal.toFixed(2)}</span>
                      )}
                      <span className="text-3xl font-bold text-accent-primary">
                        ${(discountedTotal != null ? discountedTotal : unlimitedTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-right text-[10px] text-text-muted mb-4">{t('purchase.unlimitedBilledOnce')}</p>
                  <button
                    type="button"
                    onClick={onNavigateToDeposit}
                    className="w-full py-4 bg-accent-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                  >
                    {t('purchase.confirmPurchase')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between py-3 border-b border-border-main/20">
                    <span className="text-sm text-text-muted">{t('purchase.serviceType')}</span>
                    <span className="text-sm font-medium text-text-primary">{productDisplayName}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border-main/20">
                    <span className="text-sm text-text-muted">{t('purchase.dataVolume')}</span>
                    <span className="text-sm font-medium text-text-primary">{displayVolume} GB</span>
                  </div>
                  {volumeDiscount > 0 && (
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-text-muted">{t('purchase.volumeDiscount')}</span>
                      <span className="text-sm font-medium text-accent-primary">-${volumeDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border-main/20">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-label text-text-muted uppercase">{t('purchase.totalCost')}</span>
                    <div className="text-right">
                      {appliedPromo && discountedTotal != null && discountedTotal < total && (
                        <span className="block text-xs text-text-muted line-through">${total.toFixed(2)}</span>
                      )}
                      <span className="text-3xl font-bold text-text-primary">
                        ${(discountedTotal != null ? discountedTotal : total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToDeposit}
                    className="w-full py-4 bg-accent-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                  >
                    {t('purchase.confirmPurchase')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-bg-panel border border-border-main/30 p-5 rounded-xl">
            <label className="block text-[10px] font-label font-bold text-text-muted uppercase tracking-wider mb-3">{t('purchase.promoCode')}</label>
            {appliedPromo ? (
              <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                <span className="text-sm font-medium text-accent-primary">{appliedPromo.code}</span>
                <button type="button" onClick={handleRemovePromo} className="text-xs font-semibold text-text-muted hover:text-red-400 transition-colors">{t('purchase.promoRemove')}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  placeholder={t('purchase.promoPlaceholder')}
                  className="flex-1 bg-bg-input border border-border-main/30 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent-primary focus:border-accent-primary/50"
                  disabled={promoLoading}
                />
                <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="px-4 py-2 bg-bg-panel border border-border-main/30 text-text-primary font-bold rounded-lg text-sm hover:bg-bg-panel/80 disabled:opacity-50 transition-colors">{promoLoading ? '…' : t('purchase.promoApply')}</button>
              </div>
            )}
            {promoError && <p className="mt-1.5 text-xs text-red-400">{promoError}</p>}
            {promoSuccess && <p className="mt-1.5 text-xs text-accent-secondary">{promoSuccess}</p>}
          </div>

          <div className="p-5 rounded-xl bg-accent-primary/5 border border-accent-primary/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-accent-primary mb-1">{t('purchase.instantActivation')}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{t('purchase.instantActivationDesc')}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
