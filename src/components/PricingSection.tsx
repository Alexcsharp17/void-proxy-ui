import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { productsApi } from '../api';
import type {
  Product,
  PricingTableEntry,
  PricingModifiersResponse,
} from '../api/types';
import { calculateBulkDiscount } from '../utils/bulkDiscount';

const BYTES_PER_GB = 1e9;

/** Sample tiers for Volume Discounts (labelKey = i18n key under landing.pricing). */
const VOLUME_DISCOUNT_SAMPLES: { labelKey: string; gb: number }[] = [
  { labelKey: 'tier1', gb: 100 },
  { labelKey: 'tier2', gb: 250 },
  { labelKey: 'tier3', gb: 1000 },
  { labelKey: 'tier4', gb: 2500 },
  { labelKey: 'tier5', gb: 5000 },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

/** Pick en/ru from API object based on current language. */
function getLocalized(
  value: string | { en?: string; ru?: string } | undefined,
  lang: string
): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const isRu = lang?.split('-')[0] === 'ru';
  return isRu ? (value.ru ?? value.en ?? '') : (value.en ?? value.ru ?? '');
}

function getProductDisplayName(p: Product, lang: string): string {
  const name = p.displayName ?? p.name;
  if (typeof name === 'string') return name;
  return getLocalized(name, lang);
}

function quantityToGb(entry: PricingTableEntry): number {
  return entry.quantity >= 1e6 ? entry.quantity / BYTES_PER_GB : entry.quantity;
}

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

/** Compute volume discount rows from pricing table (same formula as PurchasePage). */
function computeVolumeDiscountRows(
  gbBaseEntries: PricingTableEntry[],
  product: Product
): { labelKey: string; pricePerGb: number; savingsPct: number; isHighlight: boolean; isBold: boolean }[] {
  const valid = gbBaseEntries.filter((e) => quantityToGb(e) > 0 && ((e.basePrice ?? e.totalPrice) ?? 0) > 0);
  const sorted = [...valid].sort((a, b) => quantityToGb(a) - quantityToGb(b));
  if (sorted.length < 2) return [];
  const first = sorted[0];
  const second = sorted[1];
  const starterPricePerGb = first.basePrice ?? first.totalPrice ?? 0;
  const proThresholdGb = quantityToGb(second);
  const proPricePerGb = second.basePrice ?? second.totalPrice ?? 0;
  const attrs = getBulkAttrs(product);

  return VOLUME_DISCOUNT_SAMPLES.map((sample) => {
    const isHighlight = sample.gb === 250;
    const isBold = sample.gb === 5000;
    let pricePerGb: number;
    let savingsPct = 0;

    if (sample.gb < proThresholdGb) {
      pricePerGb = starterPricePerGb;
    } else {
      const bulk = calculateBulkDiscount({
        selectedGB: sample.gb,
        lastPackageMinGB: proThresholdGb,
        basePrice: proPricePerGb,
        ...attrs,
      });
      pricePerGb = bulk.pricePerGBWithDiscount;
      savingsPct = starterPricePerGb > 0 ? (starterPricePerGb - pricePerGb) / starterPricePerGb * 100 : 0;
    }

    return {
      labelKey: sample.labelKey,
      pricePerGb,
      savingsPct: Math.round(savingsPct),
      isHighlight,
      isBold,
    };
  });
}

function isUnlimitedProduct(product: Product): boolean {
  const unit = (product.displayUnit ?? '').toLowerCase();
  return ['hour', 'day', 'week', 'month'].includes(unit);
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center text-sm text-text-secondary">
      <Check className="w-4 h-4 mr-3 text-accent-primary shrink-0" />
      {text}
    </li>
  );
}

function DiscountRow({
  range,
  price,
  highlight,
  savingsPct,
  bold,
}: {
  range: string;
  price: string;
  highlight?: boolean;
  savingsPct?: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-xs py-1.5 border-b border-border-main/30 last:border-0 ${highlight ? 'text-accent-primary font-medium' : 'text-text-secondary'} ${bold ? 'font-bold' : ''}`}
    >
      <span>{range}</span>
      <span>
        {price}
        {savingsPct != null && savingsPct > 0 && (
          <span className="text-emerald-500 ml-1">(<SavePct pct={savingsPct} />)</span>
        )}
      </span>
    </div>
  );
}

function SavePct({ pct }: { pct: number }) {
  const { t } = useTranslation('app');
  return <>{t('landing.pricing.save', { pct })}</>;
}

function PriceTableRow({ period, price, last }: { period: string; price: string; last?: boolean }) {
  return (
    <tr className="hover:bg-accent-primary/5 transition-colors group">
      <td className={`p-3 ${!last ? 'border-b border-border-main/30' : ''}`}>{period}</td>
      <td className={`p-3 text-right font-mono text-text-primary group-hover:text-accent-primary ${!last ? 'border-b border-border-main/30' : ''}`}>
        {price}
      </td>
    </tr>
  );
}

interface ProductWithPricing {
  product: Product;
  pricingTable: PricingTableEntry[];
  modifiers: PricingModifiersResponse;
}

const GB_FEATURE_KEYS = ['gbFeature1', 'gbFeature2', 'gbFeature3', 'gbFeature4'] as const;
const UNLIMITED_FEATURE_KEYS = ['unlimitedFeature1', 'unlimitedFeature2', 'unlimitedFeature3', 'unlimitedFeature4'] as const;

export function PricingSection() {
  const { t, i18n } = useTranslation('app');
  const lang = i18n.language ?? 'en';
  const [gb, setGb] = useState<ProductWithPricing | null>(null);
  const [unlimited, setUnlimited] = useState<ProductWithPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlimitedStepIndex, setUnlimitedStepIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError('');
        const products = await productsApi.getProxyProducts();
        if (cancelled || !Array.isArray(products)) return;

        const gbProduct = products.find((p) => !isUnlimitedProduct(p));
        const unlimitedProduct = products.find((p) => isUnlimitedProduct(p));

        const loadProduct = async (p: Product | undefined): Promise<ProductWithPricing | null> => {
          if (!p) return null;
          const id = typeof p.id === 'string' ? Number(p.id) : p.id;
          try {
            const [tableRes, modRes] = await Promise.all([
              productsApi.getPricingTable(id),
              productsApi.getPricingModifiers(id),
            ]);
            const productData = tableRes.products?.find((pr) => Number(pr.productId) === Number(id));
            return {
              product: p,
              pricingTable: productData?.pricingTable ?? [],
              modifiers: modRes ?? {},
            };
          } catch {
            return { product: p, pricingTable: [], modifiers: {} };
          }
        };

        const [gbData, unlimitedData] = await Promise.all([
          loadProduct(gbProduct),
          loadProduct(unlimitedProduct),
        ]);
        if (!cancelled) {
          setGb(gbData);
          setUnlimited(unlimitedData);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('landing.pricing.loadingError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const unlimitedSteps =
    unlimited?.modifiers?.SPEED?.levels?.map((l) => ({ value: l.value, label: l.label })) ?? [];
  const currentUnlimitedStep = unlimitedSteps[unlimitedStepIndex] ?? unlimitedSteps[0];
  const unlimitedStepPct =
    unlimitedSteps.length > 1 ? (unlimitedStepIndex / (unlimitedSteps.length - 1)) * 100 : 100;

  const triggerFlight = () => {
    setIsMoving(true);
    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => setIsMoving(false), 800);
  };

  const handleUnlimitedSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnlimitedStepIndex(parseInt(e.target.value));
    triggerFlight();
  };

  const handleUnlimitedStepClick = (idx: number) => {
    setUnlimitedStepIndex(idx);
    triggerFlight();
  };

  const gbBaseEntries = gb?.pricingTable.filter((e) => !e.modifierTier && !e.modifier?.level) ?? [];
  const volumeDiscountRows = useMemo(
    () => (gb && gbBaseEntries.length >= 2 ? computeVolumeDiscountRows(gbBaseEntries, gb.product) : []),
    [gb, gbBaseEntries]
  );
  const unlimitedEntriesForStep =
    unlimited && currentUnlimitedStep
      ? unlimited.pricingTable.filter(
          (e) => e.modifierTier === currentUnlimitedStep.value || e.modifier?.level === currentUnlimitedStep.value
        )
      : unlimited?.pricingTable ?? [];

  const formatPrice = (n: number, isPerGb = false) =>
    isPerGb ? `$${n.toFixed(2)}` : `$${Math.round(n)}`;
  const formatPerGb = (total: number, qty: number) =>
    qty > 0 ? `$${(total / qty).toFixed(2)}/GB` : `$${total.toFixed(2)}`;

  return (
    <section className="py-24 bg-bg-main" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...fadeIn} className="text-center mb-16">
          <h2 className="text-3xl font-headline font-bold text-text-primary mb-4">{t('landing.pricing.title')}</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-accent-primary" aria-hidden />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400 text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {!loading && !error && (gb || unlimited) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* GB Proxies Card */}
            {gb && (
              <motion.div
                {...fadeIn}
                className="glass-card rounded-2xl p-8 flex flex-col h-full border border-border-main"
              >
                <div className="mb-8 border-b border-border-main pb-6">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {getProductDisplayName(gb.product, lang).toUpperCase()}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {getLocalized(gb.product.description, lang) || t('landing.pricing.gbDescription')}
                  </p>
                </div>

                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {GB_FEATURE_KEYS.map((key) => (
                      <FeatureItem key={key} text={t(`landing.pricing.${key}`)} />
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    {gbBaseEntries[0] && (
                      <div className="p-4 rounded-xl bg-bg-panel border border-border-main flex justify-between items-center">
                        <div>
                          <p className="text-text-primary font-semibold">{t('landing.pricing.starter')}</p>
                          <p className="text-xs text-text-secondary">
                            {getLocalized((gbBaseEntries[0] as any).quantityDisplay, lang) || t('landing.pricing.starterRange')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-accent-primary">
                            ${((gbBaseEntries[0].basePrice ?? gbBaseEntries[0].totalPrice) || 0).toFixed(2)}/GB
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/30 relative overflow-hidden">
                      {gbBaseEntries[1] ? (
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-text-primary font-semibold">{t('landing.pricing.pro')}</p>
                            <p className="text-xs text-text-secondary">
                              {getLocalized((gbBaseEntries[1] as any).quantityDisplay, lang) || t('landing.pricing.proRange')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-accent-primary">
                              ${((gbBaseEntries[1].basePrice ?? gbBaseEntries[1].totalPrice) || 0).toFixed(2)}/GB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-text-primary font-semibold">{t('landing.pricing.pro')}</p>
                            <p className="text-xs text-text-secondary">{t('landing.pricing.proRange')}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-accent-primary">$0.28</span>
                            <span className="text-xs text-text-secondary">/GB</span>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-accent-primary/20">
                        <p className="text-xs font-bold text-accent-primary uppercase tracking-widest mb-2">
                          {t('landing.pricing.volumeDiscounts')}
                        </p>
                        <p className="text-sm text-text-secondary mb-4">
                          {t('landing.pricing.volumeDiscountsDesc')}
                        </p>
                        <div className="space-y-2">
                          {volumeDiscountRows.length > 0 ? (
                            volumeDiscountRows.map((row) => {
                              const exactTier = row.labelKey === 'tier1' || row.labelKey === 'tier2' || row.labelKey === 'tier5';
                              const priceStr = exactTier
                                ? `$${row.pricePerGb.toFixed(2)}/GB`
                                : `~$${row.pricePerGb.toFixed(2)}/GB`;
                              return (
                                <DiscountRow
                                  key={row.labelKey}
                                  range={t(`landing.pricing.${row.labelKey}`)}
                                  price={priceStr}
                                  highlight={row.isHighlight}
                                  savingsPct={row.savingsPct > 0 ? row.savingsPct : undefined}
                                  bold={row.isBold}
                                />
                              );
                            })
                          ) : (
                            <>
                              <DiscountRow range={t('landing.pricing.tier1')} price="$0.30/GB" />
                              <DiscountRow range={t('landing.pricing.tier2')} price="~$0.28/GB" highlight savingsPct={7} />
                              <DiscountRow range={t('landing.pricing.tier3')} price="~$0.25/GB" savingsPct={17} />
                              <DiscountRow range={t('landing.pricing.tier4')} price="~$0.23/GB" savingsPct={24} />
                              <DiscountRow range={t('landing.pricing.tier5')} price="$0.21/GB" savingsPct={30} bold />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="w-full py-4 bg-accent-primary text-bg-main font-bold rounded-xl transition-all duration-200 uppercase tracking-widest text-sm shadow-lg shadow-accent-primary/20 hover:brightness-110 text-center"
                >
                  {t('landing.pricing.purchase')}
                </Link>
              </motion.div>
            )}

            {unlimited && (
              <motion.div
                {...fadeIn}
                className="glass-card rounded-2xl p-8 flex flex-col h-full border border-border-main"
              >
                <div className="mb-8 border-b border-border-main pb-6">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {getProductDisplayName(unlimited.product, lang).toUpperCase()}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {getLocalized(unlimited.product.description, lang) ||
                      t('landing.pricing.unlimitedDescription')}
                  </p>
                </div>

                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {UNLIMITED_FEATURE_KEYS.map((key) => (
                      <FeatureItem key={key} text={t(`landing.pricing.${key}`)} />
                    ))}
                  </ul>

                  {unlimitedSteps.length > 0 && (
                    <div className="mb-8 p-6 rounded-xl bg-bg-panel/50 border border-border-main">
                      <div className="flex justify-between items-center mb-6">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                          {t('landing.pricing.selectBandwidth')}
                        </label>
                        <span className="text-accent-primary font-mono font-bold text-lg">
                          {getLocalized(
                            (currentUnlimitedStep as { label?: string | { en?: string; ru?: string } })?.label,
                            lang
                          )}
                        </span>
                      </div>

                      <div className="relative h-12 flex items-center mb-4">
                        <div className="absolute w-full h-1 bg-border-main rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500/80 via-accent-violet to-accent-primary transition-all duration-300"
                            style={{ width: `${unlimitedStepPct}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, unlimitedSteps.length - 1)}
                          step="1"
                          value={unlimitedStepIndex}
                          onChange={handleUnlimitedSliderChange}
                          onMouseDown={() => setIsMoving(true)}
                          onMouseUp={() => setIsMoving(false)}
                          onTouchStart={() => setIsMoving(true)}
                          onTouchEnd={() => setIsMoving(false)}
                          className="absolute w-full h-full opacity-0 cursor-pointer z-30"
                        />
                        <div
                          className="absolute z-20 pointer-events-none transition-all duration-300 flex items-center"
                          style={{ left: `calc(${unlimitedStepPct}% - 32px)` }}
                        >
                          <div className="relative">
                            <div className="rotate-90 text-accent-primary/80 drop-shadow-[0_0_6px_rgba(100,138,255,0.25)]">
                              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="block">
                                <path d="M12 2L15 9H9L12 2Z" fill="currentColor" />
                                <path d="M9 9H15V17C15 18.6569 13.6569 20 12 20C10.3431 20 9 18.6569 9 17V9Z" fill="currentColor" />
                                <path d="M9 12L6 16V19L9 18V12Z" fill="currentColor" />
                                <path d="M15 12L18 16V19L15 18V12Z" fill="currentColor" />
                                <circle cx="12" cy="13" r="1.5" fill="white" fillOpacity="0.8" />
                                <rect x="11" y="16" width="2" height="1" fill="white" fillOpacity="0.4" />
                              </svg>
                            </div>
                            <div
                              className="absolute right-full top-1/2 -translate-y-1/2 flex items-center pr-1"
                              style={{ opacity: isMoving ? 1 : 0 }}
                            >
                              {isMoving && (
                                <motion.div
                                  animate={{
                                    scaleX: [1, 2.2, 1.4],
                                    scaleY: [1, 0.7, 1.2],
                                    opacity: [0.9, 1, 0.9],
                                  }}
                                  transition={{ repeat: Infinity, duration: 0.12 }}
                                  className="w-10 h-4 bg-gradient-to-l from-red-500 via-accent-violet to-transparent rounded-full origin-right blur-[1px]"
                                />
                              )}
                              {isMoving && (
                                <div className="absolute right-full flex gap-1">
                                  {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ x: 0, y: 0, scale: 0.5, opacity: 0.8 }}
                                      animate={{
                                        x: -50 - i * 20,
                                        y: (i % 3 - 1) * 15,
                                        scale: [0.5, 2.5, 3],
                                        opacity: [0.8, 0.4, 0],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.35 + i * 0.04,
                                        delay: i * 0.04,
                                      }}
                                      className="absolute w-4 h-4 bg-white/10 rounded-full blur-xl"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-text-muted font-bold px-1 mt-4">
                        {unlimitedSteps.map((step, idx) => (
                          <button
                            key={step.value}
                            type="button"
                            className={`cursor-pointer transition-colors hover:text-accent-primary ${
                              idx === unlimitedStepIndex ? 'text-accent-primary' : ''
                            }`}
                            onClick={() => handleUnlimitedStepClick(idx)}
                          >
                            {getLocalized((step as { label?: string | { en?: string; ru?: string } }).label, lang).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden border border-border-main rounded-xl mb-8">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-bg-panel text-[10px] uppercase text-text-secondary font-bold">
                        <tr>
                          <th className="p-3 border-b border-border-main">{t('landing.pricing.period')}</th>
                          <th className="p-3 border-b border-border-main text-right">{t('landing.pricing.price')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-text-secondary">
                        {unlimitedEntriesForStep.map((entry, i) => (
                          <PriceTableRow
                            key={`${getLocalized((entry as any).packageDisplayName, lang)}-${i}`}
                            period={
                              getLocalized((entry as any).packageDisplayName, lang) ||
                              getLocalized((entry as any).quantityDisplay, lang)
                            }
                            price={formatPrice(entry.totalPrice)}
                            last={i === unlimitedEntriesForStep.length - 1}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="w-full py-4 border border-accent-primary/50 text-accent-primary hover:bg-accent-primary hover:text-bg-main font-bold rounded-xl transition-all duration-200 uppercase tracking-widest text-sm text-center"
                >
                  {t('landing.pricing.purchase')}
                </Link>
              </motion.div>
            )}
          </div>
        )}

        {!loading && !error && !gb && !unlimited && (
          <p className="text-center text-text-secondary py-12">{t('landing.pricing.noPlans')}</p>
        )}
      </div>
    </section>
  );
}
