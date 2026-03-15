import React from 'react';

export interface DurationStepperOption {
  value: number;
  label: string;
  slotsLine?: string;
}

interface DurationStepperProps {
  options: DurationStepperOption[];
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
}

export default function DurationStepper({
  options,
  value,
  onChange,
  disabled = false,
}: DurationStepperProps) {
  const index =
    options.length === 0
      ? -1
      : options.findIndex((o) => o.value === value);
  const atStart = index <= 0;
  const atEnd = index >= options.length - 1 && index !== -1;
  const currentOption = index >= 0 && options[index] ? options[index] : null;

  const decrement = () => {
    if (disabled || options.length === 0 || index <= 0) return;
    onChange(options[index - 1].value);
  };

  const increment = () => {
    if (disabled || options.length === 0) return;
    if (index === -1) {
      onChange(options[0].value);
      return;
    }
    if (index >= options.length - 1) return;
    onChange(options[index + 1].value);
  };

  return (
    <div
      className="flex items-center justify-between rounded-xl border border-accent-primary/25 bg-accent-primary/5 px-4 py-2.5"
      role="group"
      aria-label="Duration selector"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || atStart}
        className="h-9 w-9 rounded-full border border-accent-primary/35 font-bold text-text-primary transition hover:bg-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="font-semibold text-text-primary">
          {currentOption?.label ?? ''}
        </span>
        {currentOption?.slotsLine && (
          <span className="text-sm text-text-muted mt-0.5">
            {currentOption.slotsLine}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || atEnd}
        className="h-9 w-9 rounded-full border border-accent-primary/35 font-bold text-text-primary transition hover:bg-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
