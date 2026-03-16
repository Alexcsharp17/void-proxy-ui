import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RefreshCw, Play, Eraser, CheckCircle, XCircle, Activity, Info, ChevronLeft } from 'lucide-react';
import { proxiesApi } from '../api';
import AutoDismissAlert from './AutoDismissAlert';

interface CheckResult {
  proxy: string;
  status: 'Working' | 'Error';
  latency: number;
  error?: string;
}

interface ProxyCheckerProps {
  /** Pre-fill proxy list when opened from Proxy Generator. Consumed once. */
  initialProxiesFromStore?: string | null;
  onConsumeInitialProxies?: () => void;
  onBackToOrders?: () => void;
}

const ProxyChecker: React.FC<ProxyCheckerProps> = ({ initialProxiesFromStore = null, onConsumeInitialProxies, onBackToOrders }) => {
  const { t } = useTranslation('app');
  const [proxyList, setProxyList] = useState('');
  const [proxyLogin, setProxyLogin] = useState('');
  const [proxyPassword, setProxyPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    proxiesApi.getCheckUsage().then((u) => !cancelled && setUsage(u)).catch(() => !cancelled && setUsage(null));
    return () => { cancelled = true; };
  }, [results.length]);

  useEffect(() => {
    if (initialProxiesFromStore != null && initialProxiesFromStore.trim() !== '') {
      setProxyList(initialProxiesFromStore.trim());
      onConsumeInitialProxies?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only apply when store has value; onConsumeInitialProxies is stable in practice
  }, [initialProxiesFromStore]);

  const buildConnectionStrings = (): string[] => {
    const lines = proxyList
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const login = proxyLogin.trim();
    const password = proxyPassword.trim();
    return lines.map((line) => {
      if (line.includes('@')) return line;
      if (login || password) return `${login}:${password}@${line}`;
      return line;
    });
  };

  const checkProxies = async () => {
    const connectionStrings = buildConnectionStrings();
    if (connectionStrings.length === 0) return;
    setChecking(true);
    setError(null);
    setResults([]);
    try {
      if (connectionStrings.length === 1) {
        const res = await proxiesApi.checkProxyIp(connectionStrings[0]);
        if (res.success && res.data) {
          const working = res.data.finalStatus === 'clean';
          setResults([
            {
              proxy: connectionStrings[0],
              status: working ? 'Working' : 'Error',
              latency: res.data.avgLatencyMs ?? 0,
              error: working ? undefined : res.data.finalMessage ?? res.data.message,
            },
          ]);
        } else {
          setResults([
            { proxy: connectionStrings[0], status: 'Error', latency: 0, error: res.message ?? 'Check failed' },
          ]);
        }
      } else {
        const res = await proxiesApi.checkProxyIpBatch(connectionStrings);
        if (res.success && res.data?.proxies) {
          const list: CheckResult[] = res.data.proxies.map((p, i) => {
            const working = p.finalStatus === 'clean';
            return {
              proxy: connectionStrings[i] ?? '',
              status: working ? 'Working' : 'Error',
              latency: p.avgLatencyMs ?? 0,
              error: working ? undefined : p.finalMessage ?? p.message,
            };
          });
          setResults(list);
        } else {
          setError(res.message ?? 'Check failed');
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (err.response?.status === 429) {
        setError(err.response?.data?.message ?? 'Daily proxy check limit reached.');
        const u = await proxiesApi.getCheckUsage().catch(() => null);
        if (u) setUsage(u);
      } else {
        setError(err.message ?? 'Failed to check proxies');
      }
    } finally {
      setChecking(false);
    }
  };

  const stats = [
    { labelKey: 'proxyChecker.working', value: results.filter((r) => r.status === 'Working').length, color: 'text-accent-secondary', icon: CheckCircle },
    { labelKey: 'proxyChecker.errors', value: results.filter((r) => r.status === 'Error').length, color: 'text-red-400', icon: XCircle },
    {
      labelKey: 'proxyChecker.avgLatency',
      value: results.length ? Math.round(results.reduce((acc, r) => acc + r.latency, 0) / results.length) + 'ms' : '0ms',
      color: 'text-accent-primary',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {typeof onBackToOrders === 'function' && (
        <div>
          <button
            type="button"
            onClick={onBackToOrders}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('proxyChecker.backToOrders')}
          </button>
        </div>
      )}
      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('proxyChecker.title')}</h3>
          </div>
          {usage && (
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {t('proxyChecker.limitPerDay', { used: usage.used, limit: usage.limit })}
            </div>
          )}
        </div>

        <AutoDismissAlert
          variant="danger"
          message={error ?? ''}
          show={!!error}
          onClose={() => setError(null)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder={t('proxyChecker.loginOptional')}
            value={proxyLogin}
            onChange={(e) => setProxyLogin(e.target.value)}
            className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm focus:border-accent-primary outline-none transition-colors"
          />
          <input
            placeholder={t('proxyChecker.passwordOptional')}
            type="password"
            value={proxyPassword}
            onChange={(e) => setProxyPassword(e.target.value)}
            className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm focus:border-accent-primary outline-none transition-colors"
          />
        </div>

        <textarea
          value={proxyList}
          onChange={(e) => setProxyList(e.target.value)}
          placeholder={t('proxyChecker.pasteProxies')}
          className="w-full h-48 bg-bg-input/50 border border-border-main/20 rounded-xl p-4 text-xs font-mono outline-none resize-none focus:border-accent-primary transition-colors"
        />

        <div className="flex gap-4">
          <button
            onClick={checkProxies}
            disabled={checking || !proxyList.trim()}
            className="flex-1 py-4 bg-accent-primary text-bg-main rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {checking ? t('proxyChecker.checking') : t('proxyChecker.check')}
          </button>
          <button
            onClick={() => {
              setProxyList('');
              setResults([]);
              setError(null);
            }}
            className="px-8 py-4 bg-bg-panel border border-border-main/20 rounded-xl font-bold uppercase tracking-widest hover:bg-bg-input transition-all flex items-center justify-center gap-2"
          >
            <Eraser className="w-4 h-4" />
            {t('proxyChecker.clear')}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{t(stat.labelKey)}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border-main/20 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary">{t('proxyChecker.results')}</h3>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{results.length} {t('proxyChecker.total')}</div>
          </div>
          <div className="max-h-96 overflow-y-auto no-scrollbar">
            {results.map((res, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b border-border-main/10 hover:bg-bg-input/30 transition-colors"
              >
                <span className="text-xs font-mono text-text-primary truncate max-w-[60%]" title={res.proxy}>
                  {res.proxy}
                </span>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      res.status === 'Working' ? 'bg-accent-secondary/10 text-accent-secondary' : 'bg-red-400/10 text-red-400'
                    }`}
                  >
                    {res.status === 'Working' ? t('proxyChecker.working') : t('proxyChecker.error')}
                  </span>
                  <span className="text-xs font-mono text-text-muted">{res.latency}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-accent-primary">
          <Info className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">{t('proxyChecker.howItWorks')}</h3>
        </div>
        <ul className="space-y-2 text-xs text-text-secondary list-disc list-inside marker:text-accent-primary">
          <li>{t('proxyChecker.step1')}</li>
          <li>{t('proxyChecker.step2')}</li>
          <li>{t('proxyChecker.step3')}</li>
          <li>{t('proxyChecker.step4')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ProxyChecker;
