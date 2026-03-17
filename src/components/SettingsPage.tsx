import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, CheckCircle2, Trash2 } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api';

const SettingsPage = ({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) => {
  const { t } = useTranslation('app');
  const [language, setLanguage] = useState('English');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user, logout } = useAuth();

  const email = user?.email && !String(user.email).startsWith('telegram_') ? user.email : null;
  const isEmailVerified = user?.isEmailVerified ?? false;
  const hasTelegram = Boolean(user?.telegramId);

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('settings.deleteAccountConfirm'))) return;
    setDeleteLoading(true);
    try {
      await userApi.deleteAccount();
      await logout();
      window.location.href = '/';
    } catch {
      setDeleteLoading(false);
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
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-6 py-3 bg-red-400 text-bg-main rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? t('common.loading') ?? '...' : t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
