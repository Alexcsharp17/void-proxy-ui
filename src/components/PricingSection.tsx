import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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

/** Sample tiers for Volume Discounts (same formula as PurchasePage). */
const VOLUME_DISCOUNT_SAMPLES: { label: string; gb: number }[] = [
  { label: '1-249 GB', gb: 100 },
  { label: '250 GB', gb: 250 },
  { label: '1,000 GB', gb: 1000 },
  { label: '2,500 GB', gb: 2500 },
  { label: '5,000+ GB', gb: 5000 },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

/** Prefer English so landing pricing cards stay in one language. */
function getLocalized(value: string | { en?: string; ru?: string } | undefined): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value.en ?? value.ru ?? '';
}

function getProductDisplayName(p: Product): string {
  const name = p.displayName ?? p.name;
  if (typeof name === 'string') return name;
  return getLocalized(name);
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
): { label: string; pricePerGb: number; savingsPct: number; isHighlight: boolean; isBold: boolean }[] {
  const valid = gbBaseEntries.filter((e) => quantityToGb(e) > 0 && ((e.basePrice ?? e.totalPrice) ?? 0) > 0);
  const sorted = [...valid].sort((a, b) => quantityToGb(a) - quantityToGb(b));
  if (sorted.length < 2) return [];
  const first = sorted[0];
  const second = sorted[1];
  // API returns basePrice/totalPrice as price per GB (per unit), not total for quantity — same as PurchasePage
  const starterPricePerGb = first.basePrice ?? first.totalPrice ?? 0;
  const proThresholdGb = quantityToGb(second);
  const proPricePerGb = second.basePrice ?? second.totalPrice ?? 0;
  const attrs = getBulkAttrs(product);

  return VOLUME_DISCOUNT_SAMPLES.map((sample, index) => {
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
      label: sample.label,
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
  savings,
  bold,
}: {
  range: string;
  price: string;
  highlight?: boolean;
  savings?: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-xs py-1.5 border-b border-border-main/30 last:border-0 ${highlight ? 'text-accent-primary font-medium' : 'text-text-secondary'} ${bold ? 'font-bold' : ''}`}
    >
      <span>{range}</span>
      <span>
        {price}
        {savings && <span className="text-emerald-500 ml-1">(Save {savings})</span>}
      </span>
    </div>
  );
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

const GB_FEATURES = [
  'Scraping & data extraction',
  'Smart IP rotation engine',
  '99.9% Network uptime',
  'Global Geo-targeting',
];
const UNLIMITED_FEATURES = [
  'Ideal for 24/7 scraping tasks',
  'SMM & multi-account management',
  'No data overage charges',
  'Instant credentials delivery',
];

export function PricingSection() {
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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <h2 className="text-3xl font-headline font-bold text-text-primary mb-4">Flexible Pricing</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Choose the plan that fits your scale. From individual developers to enterprise scrapers.
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
                    {getProductDisplayName(gb.product).toUpperCase()}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {getLocalized(gb.product.description) || 'High-performance residential proxies billed per usage.'}
                  </p>
                </div>

                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {GB_FEATURES.map((t) => (
                      <FeatureItem key={t} text={t} />
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    {/* Starter tier - first entry from API */}
                    {gbBaseEntries[0] && (
                      <div className="p-4 rounded-xl bg-bg-panel border border-border-main flex justify-between items-center">
                        <div>
                          <p className="text-text-primary font-semibold">Starter</p>
                          <p className="text-xs text-text-secondary">
                            {getLocalized((gbBaseEntries[0] as any).quantityDisplay)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-accent-primary">
                            ${((gbBaseEntries[0].basePrice ?? gbBaseEntries[0].totalPrice) || 0).toFixed(2)}/GB
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Pro tier with Volume Discounts inside */}
                    <div className="p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/30 relative overflow-hidden">
                      {gbBaseEntries[1] ? (
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-text-primary font-semibold">Pro</p>
                            <p className="text-xs text-text-secondary">
                              {getLocalized((gbBaseEntries[1] as any).quantityDisplay)}
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
                            <p className="text-text-primary font-semibold">Pro</p>
                            <p className="text-xs text-text-secondary">250+ GB</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-accent-primary">$0.28</span>
                            <span className="text-xs text-text-secondary">/GB</span>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-accent-primary/20">
                        <p className="text-xs font-bold text-accent-primary uppercase tracking-widest mb-2">
                          Volume Discounts
                        </p>
                        <p className="text-sm text-text-secondary mb-4">
                          Buy more, pay less. Up to 30% off at 5,000+ GB.
                        </p>
                        <div className="space-y-2">
                          {volumeDiscountRows.length > 0 ? (
                            volumeDiscountRows.map((row) => {
                              const exactTier = row.label === '1-249 GB' || row.label === '250 GB' || row.label === '5,000+ GB';
                              const priceStr = exactTier
                                ? `$${row.pricePerGb.toFixed(2)}/GB`
                                : `~$${row.pricePerGb.toFixed(2)}/GB`;
                              return (
                                <DiscountRow
                                  key={row.label}
                                  range={row.label}
                                  price={priceStr}
                                  highlight={row.isHighlight}
                                  savings={row.savingsPct > 0 ? `${row.savingsPct}%` : undefined}
                                  bold={row.isBold}
                                />
                              );
                            })
                          ) : (
                            <>
                              <DiscountRow range="1-249 GB" price="$0.30/GB" />
                              <DiscountRow range="250 GB" price="~$0.28/GB" highlight savings="7%" />
                              <DiscountRow range="1,000 GB" price="~$0.25/GB" savings="17%" />
                              <DiscountRow range="2,500 GB" price="~$0.23/GB" savings="24%" />
                              <DiscountRow range="5,000+ GB" price="$0.21/GB" savings="30%" bold />
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
                  Purchase
                </Link>
              </motion.div>
            )}

            {/* Unlimited Proxies Card */}
            {unlimited && (
              <motion.div
                {...fadeIn}
                className="glass-card rounded-2xl p-8 flex flex-col h-full border border-border-main"
              >
                <div className="mb-8 border-b border-border-main pb-6">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {getProductDisplayName(unlimited.product).toUpperCase()}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {getLocalized(unlimited.product.description) ||
                      'Zero traffic limits for high-volume automated operations.'}
                  </p>
                </div>

                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {UNLIMITED_FEATURES.map((t) => (
                      <FeatureItem key={t} text={t} />
                    ))}
                  </ul>

                  {unlimitedSteps.length > 0 && (
                    <div className="mb-8 p-6 rounded-xl bg-bg-panel/50 border border-border-main">
                      <div className="flex justify-between items-center mb-6">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                          Select Bandwidth
                        </label>
                        <span className="text-accent-primary font-mono font-bold text-lg">
                          {getLocalized(
                            (currentUnlimitedStep as { label?: string | { en?: string; ru?: string } })?.label
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
                            {getLocalized((step as { label?: string | { en?: string; ru?: string } }).label).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden border border-border-main rounded-xl mb-8">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-bg-panel text-[10px] uppercase text-text-secondary font-bold">
                        <tr>
                          <th className="p-3 border-b border-border-main">Period</th>
                          <th className="p-3 border-b border-border-main text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-text-secondary">
                        {unlimitedEntriesForStep.map((entry, i) => (
                          <PriceTableRow
                            key={`${getLocalized((entry as any).packageDisplayName)}-${i}`}
                            period={
                              getLocalized((entry as any).packageDisplayName) ||
                              getLocalized((entry as any).quantityDisplay)
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
                  Purchase
                </Link>
              </motion.div>
            )}
          </div>
        )}

        {!loading && !error && !gb && !unlimited && (
          <p className="text-center text-text-secondary py-12">No plans available at the moment.</p>
        )}
      </div>
    </section>
  );
}
