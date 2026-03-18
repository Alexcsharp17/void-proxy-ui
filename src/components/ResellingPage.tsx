import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  Key,
  Copy,
  RefreshCw,
  Shield,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Package,
  Lock,
} from 'lucide-react';
import { useResellerStats } from '../hooks/useResellerStats';
import { useAuth } from '../contexts/AuthContext';
import { authApi, userApi, resellerApi, getApiToken, BASE_URL } from '../api';
import { setActivePage } from '../store/slices/appSlice';
import AutoDismissAlert from './AutoDismissAlert';

function isValidIpOrCidr(ip: string): boolean {
  const trimmed = ip.trim();
  const ipv4Cidr = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  if (ipv4Cidr.test(trimmed)) {
    const [address, prefix] = trimmed.split('/');
    const parts = address.split('.').map(Number);
    if (parts.some((p) => p < 0 || p > 255)) return false;
    if (prefix !== undefined) {
      const n = parseInt(prefix, 10);
      if (isNaN(n) || n < 0 || n > 32) return false;
    }
    return true;
  }
  if (trimmed.includes('::') && trimmed.includes(':')) return true;
  return false;
}

const ResellingPage = () => {
  const { t } = useTranslation('app');
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { data: stats, loading: loadingUsage, error, isReseller } = useResellerStats();
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  useEffect(() => {
    const url = (user as { resellerWebhookUrl?: string | null })?.resellerWebhookUrl ?? '';
    const secret = (user as { resellerWebhookSecret?: string | null })?.resellerWebhookSecret ?? '';
    setWebhookUrl(url || '');
    setWebhookSecret(secret || '');
  }, [user]);

  useEffect(() => {
    if (!isReseller) return;
    let cancelled = false;
    setLoadingApiKey(true);
    userApi
      .getApiKey()
      .then((r) => !cancelled && r?.apiKey && setApiKey(r.apiKey))
      .catch(() => {})
      .finally(() => !cancelled && setLoadingApiKey(false));
    return () => { cancelled = true; };
  }, [isReseller]);

  useEffect(() => {
    if (!isReseller) return;
    let cancelled = false;
    setLoadingWhitelist(true);
    resellerApi
      .getIpWhitelist()
      .then((list) => !cancelled && setIpWhitelist(Array.isArray(list) ? list : []))
      .catch(() => {})
      .finally(() => !cancelled && setLoadingWhitelist(false));
    return () => { cancelled = true; };
  }, [isReseller]);

  const handleRegenerateApiKey = async () => {
    const token = getApiToken();
    if (!token) return;
    setActionLoading(true);
    setApiError(null);
    setSuccess(null);
    try {
      const { apiKey: newKey } = await authApi.generateApiKey(token);
      setApiKey(newKey);
      setSuccess(t('reselling.apiKeyRegenerated') ?? 'API key regenerated');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as Error)?.message ?? 'Failed';
      setApiError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey).then(() => {
        setCopiedApiKey(true);
        setTimeout(() => setCopiedApiKey(false), 2000);
      });
    }
  };

  const handleUpdateWebhookUrl = async () => {
    setActionLoading(true);
    setApiError(null);
    setSuccess(null);
    try {
      await userApi.updateResellerWebhookUrl(webhookUrl.trim() || null);
      setSuccess(t('reselling.webhookUrlUpdated') ?? 'Webhook URL updated');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as Error)?.message ?? 'Failed';
      setApiError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateSecret = async () => {
    setActionLoading(true);
    setApiError(null);
    setSuccess(null);
    try {
      const res = await userApi.regenerateResellerWebhookSecret();
      setWebhookSecret(res.secret ?? '');
      setSuccess(t('reselling.webhookSecretRegenerated') ?? 'Webhook secret regenerated');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as Error)?.message ?? 'Failed';
      setApiError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (webhookSecret) {
      navigator.clipboard.writeText(webhookSecret).then(() => {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      });
    }
  };

  const handleAddIp = async () => {
    const ip = newIp.trim();
    if (!ip) {
      setApiError('Please enter an IP address or CIDR range');
      return;
    }
    if (!isValidIpOrCidr(ip)) {
      setApiError('Invalid IP or CIDR format');
      return;
    }
    if (ipWhitelist.includes(ip)) {
      setApiError('IP already in whitelist');
      return;
    }
    setActionLoading(true);
    setApiError(null);
    setSuccess(null);
    try {
      const res = await resellerApi.updateIpWhitelist([...ipWhitelist, ip]);
      setIpWhitelist(res.whitelist ?? [...ipWhitelist, ip]);
      setNewIp('');
      setSuccess(t('reselling.ipAdded', { ip }) ?? `IP ${ip} added`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as Error)?.message ?? 'Failed';
      setApiError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveIp = async (ip: string) => {
    setActionLoading(true);
    setApiError(null);
    setSuccess(null);
    try {
      const res = await resellerApi.updateIpWhitelist(ipWhitelist.filter((x) => x !== ip));
      setIpWhitelist(res.whitelist ?? []);
      setSuccess(t('reselling.ipRemoved', { ip }) ?? `IP ${ip} removed`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (e as Error)?.message ?? 'Failed';
      setApiError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingUsage && !stats) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-2xl text-text-secondary text-sm">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isReseller) {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-8 md:p-10 rounded-2xl border border-border-main flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">{t('reselling.unlockTitle')}</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            {t('reselling.unlockMessage')}
          </p>
          <button
            type="button"
            onClick={() => dispatch(setActivePage('addons'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary/20 border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/30 transition-colors text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            {t('reselling.goToAddons')}
          </button>
        </div>
      </div>
    );
  }

  const discountPercent = stats?.discountPercent ?? 0;
  const tierNames = [t('reselling.tierBronze'), t('reselling.tierSilver'), t('reselling.tierGold'), t('reselling.tierPlatinum')];
  const currentTierName = discountPercent >= 50 ? tierNames[3] : discountPercent >= 40 ? tierNames[2] : discountPercent >= 30 ? tierNames[1] : tierNames[0];
  const isAdminOrReseller = user?.role === 'ADMIN' || user?.role === 'RESELLER';
  const docsUrl = `${BASE_URL.replace(/\/$/, '')}/docs/reseller/`;

  return (
    <div className="space-y-8">
      <AutoDismissAlert variant="danger" message={apiError ?? ''} show={!!apiError} onClose={() => setApiError(null)} />
      <AutoDismissAlert variant="success" message={success ?? ''} show={!!success} onClose={() => setSuccess(null)} />

      <h2 className="text-xl font-bold text-text-primary">{t('reselling.resellerSettings')}</h2>

      {/* 4 stat cards — as on old UI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">{stats?.totalClients ?? 0}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{t('reselling.totalClients')}</div>
            </div>
          </div>
        </div>
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">{stats?.totalOrders ?? 0}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{t('reselling.totalOrders')}</div>
            </div>
          </div>
        </div>
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">${(stats?.totalSpent ?? 0).toFixed(2)}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{t('reselling.totalSpent')}</div>
            </div>
          </div>
        </div>
        <div className="bg-bg-panel/80 border border-border-main rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text-primary font-bold text-2xl">{discountPercent}%</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{t('reselling.discountPercent')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier info — as on old UI */}
      <div className="p-6 rounded-xl bg-bg-panel/60 border border-border-main/50">
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          <span>
            {t('reselling.currentTier')}: <strong className="text-accent-primary">{currentTierName}</strong>.{' '}
          </span>
          {stats?.nextTierMinSpent != null && stats.nextTierMinSpent > 0 && (
            <span>{t('reselling.nextTierAt', { amount: stats.nextTierMinSpent })} </span>
          )}
          {t('reselling.updatedMonthly')}
        </p>
        {stats?.discountTiers?.length ? (
          <ul className="list-none m-0 mt-2 space-y-0.5 text-sm text-text-muted">
            {stats.discountTiers.map((tier, i) => (
              <li key={tier.minSpent}>
                {tierNames[i] ?? tier.label ?? `$${tier.minSpent}+`} — {tier.percent}%
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* API Connectivity — flat section */}
      <div className="bg-bg-panel/40 border border-border-main rounded-2xl p-6 lg:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-primary" />
          {t('reselling.apiConnectivity')}
        </h3>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Key className="w-3.5 h-3.5" />
            {t('reselling.apiKey')}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-input border border-border-main/20 font-mono text-sm">
              {loadingApiKey ? (
                <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              ) : (
                <span className="truncate text-text-primary">{apiKey ? '•'.repeat(Math.min(apiKey.length, 40)) : ''}</span>
              )}
              {apiKey && (
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-bg-panel text-text-muted hover:text-accent-primary transition-colors"
                  title={t('reselling.copyToClipboard')}
                >
                  {copiedApiKey ? <span className="text-accent-primary text-xs">✓</span> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleRegenerateApiKey}
              disabled={actionLoading || loadingApiKey}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-main hover:border-accent-primary/50 text-text-secondary hover:text-accent-primary transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('reselling.regenerate')}
            </button>
          </div>
          <p className="text-xs text-text-muted">{t('reselling.apiKeyDescription')}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            {t('reselling.ipWhitelist')}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder={t('reselling.ipWhitelistPlaceholder')}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-bg-input border border-border-main/20 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-primary/50 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddIp()}
              disabled={actionLoading || loadingWhitelist}
            />
            <button
              type="button"
              onClick={handleAddIp}
              disabled={actionLoading || loadingWhitelist || !newIp.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary/20 border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('reselling.add')}
            </button>
          </div>
          {loadingWhitelist ? (
            <p className="text-xs text-text-muted flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</p>
          ) : ipWhitelist.length === 0 ? (
            <p className="text-xs text-text-muted">{t('reselling.ipWhitelistEmpty')}</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {ipWhitelist.map((ip) => (
                <li
                  key={ip}
                  className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl bg-bg-input border border-border-main/20"
                >
                  <code className="text-sm text-text-primary font-mono">{ip}</code>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t('reselling.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-text-muted">{t('reselling.ipWhitelistDescription')}</p>
        </div>
      </div>

      {/* Webhook Settings — hidden for now */}

      {/* Dev API — flat section, only for reseller/admin */}
      {isAdminOrReseller && (
        <div className="bg-bg-panel/40 border border-border-main rounded-2xl p-6 lg:p-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-accent-primary" />
            {t('reselling.devApi')}
          </h3>
          <p className="text-sm text-text-secondary">{t('reselling.devApiResellerDescription')}</p>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
          >
            {t('reselling.devApiResellerSwaggerLink')}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};

export default ResellingPage;
