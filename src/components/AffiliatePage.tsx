import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, BarChart3, Copy, CheckCircle2 } from 'lucide-react';
import { useReferralStats } from '../hooks/useReferralStats';
import AutoDismissAlert from './AutoDismissAlert';

/** Referral link format as in old UI: register?ref=CODE */
function buildReferralLink(code: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/register?ref=${code}`;
}

const REFERRAL_LEVELS = [
  { emoji: '🥉', name: 'Bronze', percent: 5 },
  { emoji: '🥈', name: 'Silver', percent: 10 },
  { emoji: '🥇', name: 'Gold', percent: 20 },
  { emoji: '💎', name: 'Diamond', percent: 30 },
  { emoji: '👑', name: 'Platinum', percent: 40 },
];

const AffiliatePage = () => {
  const { t } = useTranslation('app');
  const { data: stats, loading, error } = useReferralStats();
  const [copied, setCopied] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);

  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  const totalReferrals = stats?.totalReferrals ?? 0;
  const totalEarnings = stats?.totalEarnings ?? 0;
  const commissionRate = stats?.commissionRate ?? 5;
  const referralCode = stats?.referralCode ?? '';
  const referralLevel = (stats?.referralLevel ?? 'bronze').toLowerCase();
  const levelLabel = referralLevel.charAt(0).toUpperCase() + referralLevel.slice(1);
  const referralLink = referralCode ? buildReferralLink(referralCode) : '';

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-2xl text-text-secondary text-sm flex items-center justify-center">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AutoDismissAlert
        variant="danger"
        message={error ?? ''}
        show={!!error && !errorDismissed}
        onClose={() => setErrorDismissed(true)}
      />

      <h2 className="text-xl font-bold text-text-primary">{t('affiliate.title')}</h2>

      {/* Row of 3 stat cards — as in old UI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4 h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">{totalReferrals}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {t('affiliate.totalReferrals')}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4 h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">${totalEarnings.toFixed(2)}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {t('affiliate.totalEarnings')}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4 h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">{commissionRate}%</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {t('affiliate.commissionRate')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Referral Code — as in old UI */}
      <div>
        <h5 className="text-sm font-bold text-text-primary mb-2">{t('affiliate.yourReferralCode')}</h5>
        {referralCode ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-bg-input border border-border-main/20 text-text-secondary font-mono text-sm truncate">
              {referralLink}
            </div>
            <button
              type="button"
              onClick={copyReferralLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm font-medium shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('affiliate.copiedToClipboard')}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {t('affiliate.copy')}
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-text-muted text-sm">{t('affiliate.noReferralCodeYet')}</p>
        )}
      </div>

      {/* Commission info box — as in old UI */}
      <div className="p-6 rounded-xl bg-bg-panel/60 border border-border-main/50">
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          {t('affiliate.commissionInfoShort', { level: levelLabel, percent: commissionRate })
            .split(levelLabel)
            .map((part, i, arr) =>
              i < arr.length - 1 ? (
                <React.Fragment key={i}>
                  {part}
                  <span className="font-bold text-accent-primary">{levelLabel}</span>
                </React.Fragment>
              ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
              )
            )}
        </p>
        <ul className="list-none m-0 mt-2 space-y-0.5 text-sm text-text-muted leading-relaxed">
          {REFERRAL_LEVELS.map(({ emoji, name, percent }) => (
            <li key={name}>
              {emoji} {name} {percent}%
            </li>
          ))}
        </ul>
      </div>

      {/* How it works — as in old UI */}
      <div>
        <h5 className="text-sm font-bold text-text-primary mb-3">{t('affiliate.howItWorks')}</h5>
        <ul className="list-none m-0 p-0 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
              <CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
              <span>{t(`affiliate.howItWorks${i}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AffiliatePage;
