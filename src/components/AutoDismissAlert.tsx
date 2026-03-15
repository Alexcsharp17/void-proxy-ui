import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type AutoDismissVariant = 'success' | 'danger' | 'warning' | 'info';

interface AutoDismissAlertProps {
  variant: AutoDismissVariant;
  message: string;
  show?: boolean;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AutoDismissVariant,
  { bg: string; border: string; text: string; progress: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    progress: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-400',
    progress: 'bg-red-500',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    progress: 'bg-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    progress: 'bg-blue-500',
    Icon: Info,
  },
};

const AutoDismissAlert: React.FC<AutoDismissAlertProps> = ({
  variant,
  message,
  show = true,
  dismissible = true,
  autoHide = true,
  autoHideDelay = 5000,
  onClose,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
    setTimeLeft(100);
  }, [show, message]);

  useEffect(() => {
    if (!autoHide || !isVisible || !show) return;

    const interval = Math.max(10, autoHideDelay / 100);
    const progressInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return 100;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsVisible(false);
            onClose?.();
          }, 50);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(progressInterval);
  }, [autoHide, autoHideDelay, isVisible, show, message, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !message) return null;

  const config = variantConfig[variant];
  const Icon = config.Icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-xl border ${config.bg} ${config.border} ${config.text} overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Icon className={`w-5 h-5 shrink-0 ${config.text}`} />
          <p className="text-sm font-medium flex-1">{message}</p>
          {dismissible && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {autoHide && timeLeft != null && timeLeft > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-0.5 ${config.progress}`}
            style={{ width: `${timeLeft}%`, transition: 'width 0.1s linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AutoDismissAlert;
