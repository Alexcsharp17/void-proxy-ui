import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, AlertTriangle, Shield, ChevronDown } from 'lucide-react';

interface SuccessRegistrationModalProps {
  show: boolean;
  apiKey: string;
  onGoToDashboard: () => void;
}

export default function SuccessRegistrationModal({
  show,
  apiKey,
  onGoToDashboard,
}: SuccessRegistrationModalProps) {
  const { t } = useTranslation('auth');
  const [copied, setCopied] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl bg-bg-panel border border-border-main shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
      >
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-primary/20 text-accent-primary mb-4">
              <Check className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h2 id="success-modal-title" className="text-xl font-bold text-text-primary mb-1">
              {t('successModal.title')}
            </h2>
            <p className="text-sm text-text-muted">{t('successModal.subtitle')}</p>
          </div>

          <div className="mb-4 rounded-xl bg-bg-main border border-border-main p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              {t('successModal.tokenLabel')}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={handleCopy}
              onKeyDown={(e) => e.key === 'Enter' && handleCopy()}
              className="rounded-lg bg-bg-input border border-border-main px-4 py-3 font-mono text-sm text-accent-primary break-all cursor-pointer hover:border-accent-primary/50 transition-colors select-all"
              title={t('successModal.clickToCopy')}
            >
              {apiKey}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors mb-4 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-accent-primary text-white hover:opacity-90 border border-transparent'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                {t('successModal.copied')}
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                {t('successModal.copyToken')}
              </>
            )}
          </button>

          <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary text-sm">{t('successModal.warningTitle')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('successModal.warningText')}</p>
            </div>
          </div>

          <div className="flex gap-3 p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20 mb-6">
            <Shield className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary text-sm">{t('successModal.securityTitle')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('successModal.securityText')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToDashboard}
            className="w-full rounded-xl py-3 font-semibold border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white transition-colors"
          >
            {t('successModal.goToDashboard')}
          </button>

          <details className="mt-4 group" open={tipsOpen} onToggle={() => setTipsOpen(!tipsOpen)}>
            <summary className="list-none flex items-center justify-center gap-1 text-sm text-text-muted cursor-pointer hover:text-text-secondary">
              {t('successModal.tipsTitle')}
              <ChevronDown className={`w-4 h-4 transition-transform ${tipsOpen ? 'rotate-180' : ''}`} />
            </summary>
            <ul className="mt-3 pl-5 text-sm text-text-muted space-y-1 list-disc">
              <li>{t('successModal.tip1')}</li>
              <li>{t('successModal.tip2')}</li>
              <li>{t('successModal.tip3')}</li>
              <li>{t('successModal.tip4')}</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
