import React, { useState, useRef, useEffect } from 'react';
import { Menu, Languages, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import { setLocale, type Locale } from '../store/slices/appSlice';
import { updateLanguage } from '../i18n/config';
import { Page } from '../types';
import type { User } from '../api';

interface HeaderProps {
  activePage: Page;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  user?: User | null;
  balance?: number | null;
  currency?: string;
  /** Пока баланс запрашивается — показать плейсхолдер, не ждать заказы. */
  balanceLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  activePage,
  onMenuClick,
  onSettingsClick,
  user,
  balance,
  currency = 'USD',
  balanceLoading = false,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('app');
  const locale = useSelector((s: RootState) => s.app.locale);
  const purchaseSegment = useSelector((s: RootState) => s.app.purchaseSegment);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? user?.email ?? user?.telegramUsername ?? t('common.user');
  const avatarUrl = user?.photoUrl ?? null;
  const balanceStr = balance != null ? `${Number(balance).toFixed(2)} ${currency}` : null;
  const showBalanceBlock = balanceStr != null || balanceLoading;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const getTitle = () => {
    switch (activePage) {
      case 'overview': return t('header.dashboard');
      case 'reselling': return t('header.business');
      case 'affiliate': return t('header.affiliate');
      case 'proxy-checker': return t('header.proxyChecker');
      case 'proxy-generator': return t('header.proxyGenerator');
      case 'deposit': return t('header.deposit');
      case 'plans': return t('header.plans');
      case 'purchase': return purchaseSegment === 'unlimited' ? t('header.plansPricingUnlimited') : t('header.plansPricingGb');
      case 'addons': return t('header.addons');
      case 'support': return t('header.support');
      case 'settings': return t('header.settings');
      default: return t('header.settings');
    }
  };

  const getSubtitle = () => {
    switch (activePage) {
      case 'overview': return t('header.subtitleOverview');
      case 'reselling': return t('header.subtitleReselling');
      case 'affiliate': return t('header.subtitleAffiliate');
      case 'proxy-checker': return t('header.subtitleProxyChecker');
      case 'proxy-generator': return t('header.subtitleProxyGenerator');
      case 'deposit': return t('header.subtitleDeposit');
      case 'plans': return t('header.subtitlePlans');
      case 'purchase': return '';
      case 'addons': return t('header.subtitleAddons');
      case 'support': return t('header.subtitleSupport');
      case 'settings': return t('header.subtitleSettings');
      default: return t('header.subtitleSettings');
    }
  };

  const localeLabels: Record<'en' | 'ru', string> = { en: t('header.english'), ru: t('header.russian') };

  return (
    <header className="px-6 lg:px-10 py-6 flex items-center justify-between bg-bg-panel/50 backdrop-blur-md sticky top-0 z-40 border-b border-border-main">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 hover:bg-bg-panel/50 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {getTitle()}
          </h2>
          {getSubtitle() ? (
            <p className="text-text-secondary text-xs lg:text-sm mt-1">{getSubtitle()}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2">
        {showBalanceBlock && (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('header.balance')}</p>
              <p
                className={`text-sm font-semibold text-text-primary min-w-[5rem] ${balanceLoading && balanceStr == null ? 'animate-pulse text-text-muted' : ''}`}
              >
                {balanceLoading && balanceStr == null ? '…' : balanceStr}
              </p>
            </div>
            <div className="hidden sm:block h-10 w-[1px] bg-border-main mx-0.5 lg:mx-1 shrink-0"></div>
          </>
        )}
        <div className="hidden sm:block relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="w-10 h-10 rounded-xl bg-bg-panel border border-border-main text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 transition-colors flex items-center justify-center shrink-0"
            title={localeLabels[locale]}
          >
            <Languages className="w-5 h-5" />
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-1 py-1 min-w-[6rem] rounded-xl bg-bg-panel border border-border-main shadow-lg z-50">
              {(['en', 'ru'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    dispatch(setLocale(l));
                    updateLanguage(l);
                    setLangOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${locale === l ? 'text-accent-primary bg-accent-primary/10' : 'text-text-secondary hover:bg-bg-input hover:text-text-primary'}`}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hidden sm:block h-10 w-[1px] bg-border-main mx-0.5 lg:mx-1 shrink-0"></div>
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onSettingsClick}
        >
          <div className="text-right hidden xs:block">
            <p className="text-sm font-semibold group-hover:text-accent-primary transition-colors truncate max-w-[140px]" title={displayName}>
              {displayName}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-accent-primary/30 group-hover:border-accent-primary transition-all bg-bg-input flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-lg font-bold text-accent-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
