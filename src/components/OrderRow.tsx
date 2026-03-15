import React, { useState } from 'react';
import { Order } from '../types';

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

const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const statusStyles = getStatusIconStyles(order.status);
  const statusLabel = toText(order.status);

  return (
    <div
      className="flex items-center justify-between p-6 border-b border-border-main/10 hover:bg-bg-input/30 transition-colors group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-default ${statusStyles.container}`}
            aria-label={statusLabel}
          >
            {order.icon}
          </div>
          {showTooltip && statusLabel && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1.5 rounded-lg bg-bg-panel border border-border-main shadow-lg text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap z-10 pointer-events-none"
              role="tooltip"
            >
              {statusLabel}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">{toText(order.product)}</p>
          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">{toText(order.quantity)}</p>
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
