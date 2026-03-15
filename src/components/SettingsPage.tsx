import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, CheckCircle2, Trash2, Zap, Loader2 } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api';
import type { Order } from '../api/types';
import { toServiceType } from '../enums/api';

function findFirstGbOrder(orders: Order[]): Order | null {
  for (const o of orders) {
    if (toServiceType(o.serviceType) !== 'Proxies') continue;
    const baseUnit = (o as Order & { baseUnit?: string }).baseUnit ?? '';
    const displayUnit = (o as Order & { displayUnit?: string }).displayUnit ?? '';
    if (baseUnit === 'second' && /^hour$/i.test(displayUnit)) continue;
    if (baseUnit === 'byte' && /^gb$/i.test(displayUnit)) return o;
  }
  return null;
}

const SettingsPage = ({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) => {
  const { t } = useTranslation('app');
  const [language, setLanguage] = useState('English');
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [autoReplenishSaving, setAutoReplenishSaving] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const email = user?.email && !String(user.email).startsWith('telegram_') ? user.email : null;
  const isEmailVerified = user?.isEmailVerified ?? false;
  const hasTelegram = Boolean(user?.telegramId);

  const gbOrder = findFirstGbOrder(orders);
  const autoRefill = gbOrder?.autoRefill ?? false;
  const autoRefillAmountGb = gbOrder?.autoRefillAmountGb ?? null;

  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    ordersApi
      .getOrders()
      .then((list) => !cancelled && setOrders(list))
      .catch(() => !cancelled && setOrders([]))
      .finally(() => !cancelled && setOrdersLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (gbOrder != null) {
      setAmountInput(gbOrder.autoRefillAmountGb != null ? String(gbOrder.autoRefillAmountGb) : '');
    }
  }, [gbOrder?.id, gbOrder?.autoRefillAmountGb]);

  const handleAutoRefillToggle = async () => {
    if (!gbOrder) return;
    setAutoReplenishSaving(true);
    try {
      const updated = await ordersApi.updateOrder(gbOrder.id, { autoRefill: !autoRefill });
      setOrders((prev) => prev.map((o) => (o.id === gbOrder.id ? { ...o, autoRefill: updated.autoRefill, autoRefillAmountGb: updated.autoRefillAmountGb } : o)));
    } finally {
      setAutoReplenishSaving(false);
    }
  };

  const handleAmountBlur = async () => {
    if (!gbOrder) return;
    const num = parseFloat(amountInput);
    if (Number.isNaN(num) || num < 0.01 || num > 1000) {
      setAmountInput(gbOrder.autoRefillAmountGb != null ? String(gbOrder.autoRefillAmountGb) : '');
      return;
    }
    if (num === (gbOrder.autoRefillAmountGb ?? 0)) return;
    setAutoReplenishSaving(true);
    try {
      const updated = await ordersApi.updateOrder(gbOrder.id, { autoRefillAmountGb: num });
      setOrders((prev) => prev.map((o) => (o.id === gbOrder.id ? { ...o, autoRefillAmountGb: updated.autoRefillAmountGb } : o)));
    } finally {
      setAutoReplenishSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div className="space-y-6">
          {/* Preferences */}
          <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-accent-primary" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('settings.preferences')}</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CustomSelect 
                label={t('settings.interfaceLanguage')}
                value={language}
                onChange={setLanguage}
                options={['English', 'Russian', 'Spanish', 'German', 'Chinese']}
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('settings.appearance')}</label>
                <div className="flex p-1 bg-bg-input rounded-xl border border-border-main/20">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-bg-panel text-accent-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    {t('settings.light')}
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-bg-panel text-accent-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    {t('settings.dark')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Replenish — привязано к первому GB-заказу */}
          <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-accent-primary" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('settings.autoReplenish')}</h4>
            </div>
            <p className="text-xs text-text-secondary">{t('settings.autoReplenishDesc')}</p>

            {ordersLoading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : !gbOrder ? (
              <p className="text-sm text-text-muted">{t('settings.autoReplenishNoOrder')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">{t('settings.autoReplenishToggleDesc')}</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary">
                      {autoRefill ? t('settings.autoReplenishEnabled') : t('settings.autoReplenishDisabled')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoRefill}
                      disabled={autoReplenishSaving}
                      onClick={handleAutoRefillToggle}
                      className={`relative w-11 h-6 rounded-full border transition-colors shrink-0 ${autoRefill ? 'bg-accent-primary border-accent-primary' : 'bg-bg-input border-border-main/20'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoRefill ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>

                {autoRefill && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('settings.autoReplenishMode')}</label>
                      <div className="px-4 py-3 rounded-xl bg-bg-input border border-border-main/20 text-sm text-text-primary">
                        {t('settings.autoReplenishModeThreshold')}
                      </div>
                      <p className="text-xs text-text-muted">{t('settings.autoReplenishModeDesc')}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('settings.autoReplenishAmount')}</label>
                      <input
                        type="number"
                        min={0.01}
                        max={1000}
                        step={0.01}
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        onBlur={handleAmountBlur}
                        disabled={autoReplenishSaving}
                        className="w-full max-w-[12rem] px-4 py-2.5 rounded-xl bg-bg-input border border-border-main/20 text-text-primary text-sm focus:border-accent-primary/50 focus:outline-none"
                      />
                      <p className="text-xs text-text-muted">{t('settings.autoReplenishAmountHint')}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Login methods — content from old UI, layout as in new */}
          <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('settings.loginMethods')}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('settings.email')}</label>
                {email ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-bg-input border border-border-main/20">
                    <span className="text-sm text-text-primary truncate">{email}</span>
                    {isEmailVerified ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('settings.confirmed')}
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">{t('settings.unconfirmed')}</span>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-bg-input border border-border-main/20 text-text-muted text-sm">{t('settings.noEmail')}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('settings.telegram')}</label>
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-bg-input border border-border-main/20">
                  <span className="flex items-center gap-2 text-sm text-text-primary">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    {hasTelegram ? t('settings.linked') : t('settings.notLinked')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 lg:p-8 rounded-2xl border border-red-400/20 bg-red-400/5 space-y-6">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-red-400">{t('settings.dangerZone')}</h4>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-text-primary">{t('settings.deleteAccount')}</p>
                <p className="text-[10px] text-text-secondary mt-1">{t('settings.deleteAccountDesc')}</p>
              </div>
              <button className="px-6 py-3 bg-red-400 text-bg-main rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-all">
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
