import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Check, CheckCircle2 } from 'lucide-react';
import { productsApi } from '../api';
import type { Product, PricingTableEntry, PricingModifiersResponse, ProductUiAttribute } from '../api/types';
import DurationStepper, { type DurationStepperOption } from './DurationStepper';

function getLocalized(value: string | { en?: string; ru?: string } | undefined, lang: string): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const code = lang.startsWith('ru') ? 'ru' : 'en';
  return value[code] ?? value.en ?? value.ru ?? '';
}

function getProductDisplayName(p: Product, lang: string): string {
  const name = p.displayName ?? p.name;
  if (typeof name === 'string') return name;
  return getLocalized(name, lang);
}

function isUnlimitedProduct(product: Product): boolean {
  const unit = (product.displayUnit ?? '').toLowerCase();
  return ['hour', 'day', 'week', 'month'].includes(unit);
}

interface PlanCardProps {
  product: Product;
  onNavigateToDeposit: () => void;
  /** Optional: show reseller badge (e.g. when user has reseller discount) */
  showResellerBadge?: boolean;
}

export default function PlanCard({ product, onNavigateToDeposit, showResellerBadge = false }: PlanCardProps) {
  const { t, i18n } = useTranslation('app');
  const lang = i18n.language || 'en';
  const [pricingTable, setPricingTable] = useState<PricingTableEntry[]>([]);
  const [modifiers, setModifiers] = useState<PricingModifiersResponse>({});
  const [modifierType, setModifierType] = useState<string | null>(null);
  const [modifierLevel, setModifierLevel] = useState<number>(0);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const productId = typeof product.id === 'string' ? Number(product.id) : product.id;
  const hasModifiers = product.pricingModifiers && Array.isArray(product.pricingModifiers) && product.pricingModifiers.length > 0;
  const hasExpirationDays = hasModifiers && (product.pricingModifiers as string[]).includes('EXPIRATION_DAYS');
  const hasSpeed = hasModifiers && (product.pricingModifiers as string[]).includes('SPEED');
  const isUnlimited = isUnlimitedProduct(product);
  const accentColor = isUnlimited ? 'accent-violet' : 'accent-primary';
  const accentIcon = isUnlimited ? 'text-accent-violet' : 'text-accent-primary';

  const subtitle = getLocalized(product.description, lang) || product.fullDescription || (isUnlimited ? 'Dedicated High-Speed Bandwidth' : 'Residential IP Network');

  const uiFeatures: ProductUiAttribute[] = (product.productDetails?.ui && Array.isArray(product.productDetails.ui))
    ? [...product.productDetails.ui].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    : [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tableRes, modRes] = await Promise.all([
          productsApi.getPricingTable(productId),
          hasModifiers ? productsApi.getPricingModifiers(productId) : Promise.resolve({}),
        ]);
        if (cancelled) return;
        const productData = tableRes.products?.find((p) => Number(p.productId) === Number(productId));
        setPricingTable(productData?.pricingTable ?? []);
        setModifiers(modRes ?? {});
        const expLevels = modRes && 'EXPIRATION_DAYS' in modRes ? (modRes as PricingModifiersResponse).EXPIRATION_DAYS?.levels : undefined;
        const speedLevels = modRes && 'SPEED' in modRes ? (modRes as PricingModifiersResponse).SPEED?.levels : undefined;
        if (hasExpirationDays && expLevels?.length) {
          setModifierType('EXPIRATION_DAYS');
          setModifierLevel(expLevels[0].value);
        } else if (hasSpeed && speedLevels?.length) {
          setModifierType('SPEED');
          setModifierLevel(speedLevels[0].value);
        }
      } catch {
        if (!cancelled) setPricingTable([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, hasModifiers, hasExpirationDays, hasSpeed]);

  const displayEntries = (() => {
    if (pricingTable.length === 0) return [];
    if (modifierType && modifierLevel > 0) {
      const filtered = pricingTable.filter((e) => e.modifierTier === modifierLevel || e.modifier?.level === modifierLevel);
      if (filtered.length > 0) return filtered;
      const withFirst = pricingTable.filter((e) => e.modifierTier === 1 || e.modifier?.level === 1);
      if (withFirst.length > 0) return withFirst;
    }
    const noModifier = pricingTable.filter((e) => !e.modifierTier && !e.modifier?.level);
    if (noModifier.length > 0) return noModifier;
    return pricingTable;
  })();

  const stepperOptions: DurationStepperOption[] = (() => {
    if (modifierType === 'EXPIRATION_DAYS' && 'EXPIRATION_DAYS' in modifiers && modifiers.EXPIRATION_DAYS) {
      return modifiers.EXPIRATION_DAYS.levels.map((l) => ({ value: l.value, label: l.label }));
    }
    if (modifierType === 'SPEED' && 'SPEED' in modifiers && modifiers.SPEED) {
      return modifiers.SPEED.levels.map((l) => ({ value: l.value, label: l.label }));
    }
    return [];
  })();

  const displayUnit = product.displayUnit ?? 'GB';

  const formatPrice = (price: number) => {
    if (['hour', 'day', 'week', 'month'].includes(displayUnit)) {
      return String(Math.round(price));
    }
    return price.toFixed(2);
  };

  const featureKeys = isUnlimited ? (['cleanIp', 'fixedSpeed', 'smm', 'tasks24'] as const) : (['cleanIp', 'payPerTraffic', 'rotation', 'scraping'] as const);
  const featureNamespace = isUnlimited ? 'featuresUnlimited' : 'featuresGb';

  return (
    <div className="glass-card relative flex flex-col overflow-hidden rounded-[2rem] p-8 lg:p-10 min-h-[420px]">
      <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 bg-accent-primary/5 blur-3xl" aria-hidden />
      {isUnlimited && (
        <div className="absolute top-0 right-0 h-48 w-48 -mr-20 -mt-20 bg-accent-violet/5 blur-3xl" aria-hidden />
      )}

      <div className="mb-8 flex flex-shrink-0 items-start justify-between gap-4">
        <div>
          <h3 className={`mb-1 text-xl font-bold uppercase tracking-wider ${isUnlimited ? 'text-accent-violet' : 'text-accent-primary'}`}>
            {getProductDisplayName(product, lang)}
          </h3>
          <p className="text-xs text-text-muted font-label">
            {subtitle}
          </p>
        </div>
        {showResellerBadge && (
          <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-label uppercase tracking-tight ${isUnlimited ? 'bg-accent-violet/20 border-accent-violet/30 text-accent-violet' : 'bg-accent-primary/20 border-accent-primary/30 text-accent-primary'}`}>
            {t('plans.resellerBadge')}
          </span>
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        {uiFeatures.length > 0
          ? uiFeatures.slice(0, 6).map((attr) => (
              <div key={attr.key} className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${accentIcon}`} aria-hidden />
                <span className="text-sm font-medium">{getLocalized(attr.label, lang)}</span>
              </div>
            ))
          : featureKeys.map((key) => (
              <div key={key} className="flex items-center gap-3 text-text-secondary">
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${accentIcon}`} aria-hidden />
                <span className="text-sm font-medium">{t(`plans.${featureNamespace}.${key}`)}</span>
              </div>
            ))}
      </div>

      {hasModifiers && stepperOptions.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border-main/50 bg-bg-input/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-text-muted">
              {t('plans.selectBandwidth')}
            </span>
            <span className={`font-bold font-label ${isUnlimited ? 'text-accent-violet' : 'text-accent-primary'}`}>
              {stepperOptions.find((o) => o.value === modifierLevel)?.label ?? ''}
            </span>
          </div>
          <DurationStepper
            options={stepperOptions}
            value={modifierLevel}
            onChange={(next) => {
              if (next != null) setModifierLevel(next);
              setSelectedRowIndex(null);
            }}
          />
        </div>
      )}

      <div className="flex-1 min-h-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-main/50 text-[10px] font-label uppercase tracking-widest text-text-muted">
              <th className="pb-4 font-normal">{t('plans.packageHeader')}</th>
              <th className="pb-4 font-normal text-right">
                {isUnlimited ? t('plans.priceHeader') : t('plans.pricePerGb')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/5">
            {displayEntries.map((entry, idx) => {
              const isSelected = selectedRowIndex === idx;
              return (
                <tr
                  key={`${entry.packageDisplayName}-${entry.modifierTier ?? 'base'}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRowIndex(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRowIndex(idx);
                    }
                  }}
                  className={`cursor-pointer transition-colors hover:bg-bg-panel/80 ${isSelected ? 'bg-accent-primary/10' : ''}`}
                >
                  <td className="py-4 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 shrink-0 opacity-70" />
                      {entry.packageDisplayName || entry.quantityDisplay}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-lg font-bold text-text-primary">
                      ${formatPrice(entry.totalPrice)}
                    </span>
                    {isSelected && (
                      <Check className="ml-2 inline-block h-5 w-5 text-accent-primary" aria-hidden />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex-shrink-0">
        <button
          type="button"
          onClick={onNavigateToDeposit}
          className={`w-full rounded-2xl py-4 font-bold uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-[1.02] ${isUnlimited ? 'bg-accent-violet text-bg-main shadow-accent-violet/20 hover:opacity-95' : 'bg-accent-primary text-white shadow-accent-primary/20 hover:opacity-95'}`}
        >
          {t('plans.order')}
        </button>
      </div>
    </div>
  );
}
