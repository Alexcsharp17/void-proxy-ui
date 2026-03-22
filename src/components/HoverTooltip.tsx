import React, { useState } from 'react';

/**
 * Default “quick” hover tooltip bubble — use this class if you need a custom trigger
 * but the same look (e.g. porting legacy markup).
 */
export const hoverTooltipBubbleClassName =
  'absolute left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-bg-panel border border-border-main shadow-lg text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap pointer-events-none z-[100]';

export interface HoverTooltipProps {
  /** Tooltip body (text or React node). */
  content: React.ReactNode;
  children: React.ReactNode;
  /** `top` — bubble above the trigger (default). `bottom` — below. */
  side?: 'top' | 'bottom';
  className?: string;
  /** Extra classes merged onto the bubble (in addition to {@link hoverTooltipBubbleClassName}). */
  bubbleClassName?: string;
  /**
   * When false, the bubble never shows (wrapper still handles hover for future use).
   * Use e.g. `openWhen={Boolean(label)}` if content can be empty.
   */
  openWhen?: boolean;
}

/**
 * Instant hover tooltip (no native `title=` delay). One place for styles app-wide.
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  content,
  children,
  side = 'top',
  className = '',
  bubbleClassName = '',
  openWhen = true,
}) => {
  const [show, setShow] = useState(false);
  const canShow =
    openWhen &&
    content != null &&
    (typeof content !== 'string' || content.trim() !== '');

  const visible = show && canShow;

  const positionClass = side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';

  return (
    <div
      className={`relative ${className}`.trim() || undefined}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {visible && (
        <div
          className={`${hoverTooltipBubbleClassName} ${positionClass} ${bubbleClassName}`.trim()}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
