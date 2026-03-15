import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mail, ChevronDown } from 'lucide-react';

const env = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined;
const TELEGRAM_SUPPORT_USERNAME = (env?.VITE_TELEGRAM_SUPPORT_USERNAME?.trim() || 'void_panel_support').replace(/^@/, '');
const SUPPORT_EMAIL = env?.VITE_SUPPORT_EMAIL?.trim() || 'void.panel.team+support@gmail.com';
const TELEGRAM_SUPPORT_URL = `https://t.me/${TELEGRAM_SUPPORT_USERNAME}`;
const emailUrl = `mailto:${SUPPORT_EMAIL}`;

const FAQ_KEYS = [
  'whatAreProxies',
  'trafficExpire',
  'stickySessions',
  'howToStart',
  'paymentMethods',
  'refunds',
  'contactSupport',
  'api',
] as const;

export default function SupportPage() {
  const { t } = useTranslation('app');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          {t('support.contactTitle')}
        </h2>
        <p className="text-sm text-text-muted mb-6">{t('support.subtitle')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={TELEGRAM_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 p-5 rounded-xl bg-bg-panel border border-border-main/30 hover:border-accent-primary/40 hover:bg-bg-panel/90 transition-colors group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
              <Send className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                {t('support.telegramDm')}
              </h3>
              <p className="text-sm text-text-muted mb-3">
                {t('support.telegramDmDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary">
                {t('support.writeInTelegram')}
                <ChevronDown className="h-4 w-4 rotate-[270deg]" />
              </span>
            </div>
          </a>

          <a
            href={emailUrl}
            className="flex gap-4 p-5 rounded-xl bg-bg-panel border border-border-main/30 hover:border-accent-primary/40 hover:bg-bg-panel/90 transition-colors group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
              <Mail className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                {t('support.email')}
              </h3>
              <p className="text-sm text-text-muted mb-3">
                {t('support.emailDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary">
                {t('support.sendEmail')}
                <ChevronDown className="h-4 w-4 rotate-[270deg]" />
              </span>
            </div>
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          {t('support.faqTitle')}
        </h2>
        <p className="text-sm text-text-muted mb-6">{t('support.faqSubtitle')}</p>

        <div className="divide-y divide-border-main/50 rounded-xl border border-border-main/30 bg-bg-panel overflow-hidden">
          {FAQ_KEYS.map((key, index) => {
            const isOpen = openFaqIndex === index;
            const question = t(`support.faq.${key}.question`);
            const answer = t(`support.faq.${key}.answer`);
            return (
              <div key={key} className="bg-bg-panel">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-main/50 transition-colors"
                >
                  <span className="font-medium text-text-primary">{question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-sm text-text-muted leading-relaxed">
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
