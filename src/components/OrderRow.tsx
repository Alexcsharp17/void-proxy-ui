import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Order } from '../types';
import { HoverTooltip } from './HoverTooltip';
import { formatUnlimitedTimeRatioPart } from '../api/mappers/orders';

type UnlimitedMeta = NonNullable<Order['unlimitedTimeMeta']>;

function getRemainingSecondsLive(meta: UnlimitedMeta): number {
  const { expiresAt, effectiveLimitSeconds, quantityRemainingSec, createdAt } = meta;
  if (expiresAt) {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }
  if (quantityRemainingSec != null && !Number.isNaN(quantityRemainingSec)) {
    return Math.max(0, quantityRemainingSec);
  }
  const created = new Date(createdAt).getTime();
  const elapsed = Math.floor((Date.now() - created) / 1000);
  return Math.max(0, effectiveLimitSeconds - elapsed);
}

/** Live "rem / total" for unlimited time proxy — same idea as GB row (rem GB / total GB). */
function UnlimitedTimeUsedTotal({ meta }: { meta: UnlimitedMeta }) {
  const { t } = useTranslation('app');
  const totalSec = Math.max(1, meta.effectiveLimitSeconds);
  const [remainingSec, setRemainingSec] = useState(() => getRemainingSecondsLive(meta));

  useEffect(() => {
    const tick = () => setRemainingSec(getRemainingSecondsLive(meta));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [meta.createdAt, meta.effectiveLimitSeconds, meta.expiresAt, meta.quantityRemainingSec]);

  const isExpired = remainingSec <= 0;
  const line = `${formatUnlimitedTimeRatioPart(remainingSec)} / ${formatUnlimitedTimeRatioPart(totalSec)}`;

  return (
    <p
      className={`text-[10px] font-medium tracking-wide ${isExpired ? 'text-red-400' : 'text-text-secondary'}`}
      title={t('dashboard.orderDurationHint')}
    >
      {line}
    </p>
  );
}

/** Ensure value is renderable as React child (string/number), not object e.g. { en, ru } */
function toText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object' && 'en' in (v as object)) return String((v as { en?: string }).en ?? (v as { ru?: string }).ru ?? '');
  return String(v);
}

/** Icon container + tooltip color by order status */
function getStatusIconStyles(status: Order['status']): { container: string; tooltip?: string } {
  switch (status) {
    case 'Completed':
      return { container: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' };
    case 'Queued':
      return { container: 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' };
    case 'Processing':
      return { container: 'bg-amber-500/15 border-amber-500/30 text-amber-400' };
    case 'Partial':
      return { container: 'bg-orange-500/15 border-orange-500/30 text-orange-400' };
    case 'Error':
      return { container: 'bg-red-500/15 border-red-500/30 text-red-400' };
    case 'Cancelled':
      return { container: 'bg-text-muted/15 border-border-main/30 text-text-muted' };
    default:
      return { container: 'bg-bg-panel border-border-main/20 text-text-secondary' };
  }
}

const OrderRow: React.FC<{ order: Order; onOrderClick?: (order: Order) => void }> = ({ order, onOrderClick }) => {
  const { t } = useTranslation('app');
  const statusStyles = getStatusIconStyles(order.status);
  const statusLabel = toText(order.status);

  return (
    <div
      role={onOrderClick ? 'button' : undefined}
      tabIndex={onOrderClick ? 0 : undefined}
      onClick={onOrderClick ? () => onOrderClick(order) : undefined}
      onKeyDown={onOrderClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOrderClick(order); } } : undefined}
      className={`flex items-center justify-between p-6 border-b border-border-main/10 transition-colors group ${onOrderClick ? 'cursor-pointer hover:bg-bg-input/30' : ''}`}
    >
      <div className="flex items-center gap-4">
        <HoverTooltip content={statusLabel} openWhen={!!statusLabel} className="shrink-0">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-default ${statusStyles.container}`}
            aria-label={statusLabel}
          >
            {order.icon}
          </div>
        </HoverTooltip>
        <div>
          <p className="text-sm font-bold text-text-primary leading-snug">
            <span>{toText(order.product)}</span>
            {order.productSpeedSuffix ? (
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary font-sans normal-case tracking-normal">
                {' '}
                ({toText(order.productSpeedSuffix)})
              </span>
            ) : null}
          </p>
          {order.unlimitedTimeMeta ? (
            <div className="mt-0.5">
              <UnlimitedTimeUsedTotal meta={order.unlimitedTimeMeta} />
            </div>
          ) : (
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">{toText(order.quantity)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-emerald-400">{toText(order.price)}</p>
          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">{toText(order.date)}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderRow;
