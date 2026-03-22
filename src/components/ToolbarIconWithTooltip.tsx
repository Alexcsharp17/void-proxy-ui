import React from 'react';
import { HoverTooltip } from './HoverTooltip';

export interface ToolbarIconWithTooltipProps {
  /** Shown above the button on hover. */
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonClassName: string;
}

/** Toolbar icon button wrapped with {@link HoverTooltip}. */
export const ToolbarIconWithTooltip: React.FC<ToolbarIconWithTooltipProps> = ({
  label,
  children,
  disabled,
  onClick,
  buttonClassName,
}) => (
  <HoverTooltip content={label} openWhen={!!label}>
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={buttonClassName}>
      {children}
    </button>
  </HoverTooltip>
);
