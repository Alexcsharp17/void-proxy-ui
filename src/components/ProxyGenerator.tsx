import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  RefreshCw,
  FileText,
  Copy,
  Download,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  Save,
  Trash2,
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { Compartment, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import CustomSelect from './CustomSelect';
import CountrySearchDropdown from './CountrySearchDropdown';
import AutoDismissAlert from './AutoDismissAlert';
import { ToolbarIconWithTooltip } from './ToolbarIconWithTooltip';
import { ordersApi, publicApi, type Order } from '../api';
import { VOID_PROXY_COUNTRIES } from '../utils/voidProxyCountries';
import { toServiceType, ServiceType } from '../enums/api';
import {
  parseProxyConnectionString,
  generateProxyConnectionString,
  generateShortSessionId,
  stripProxyConnectionScheme,
  stripProxyConnectionSchemeFromText,
  filterVoidProxyCredentialLinesForUi,
  isShowableVoidProxyCredentialLine,
  getInvalidCredentialLineKeys,
  type ProxyProtocol,
} from '../utils/proxyConnectionString';
import { proxyListEditorTheme, proxyLineDecorationsExtension } from '../utils/proxyListCodeMirror';

/** Same bounds as legacy Maskify UI */
const TTL_SECONDS_MIN = 1;
const TTL_SECONDS_MAX = 21600;

const PROXY_DELETE_DEBUG = false;

/** Only intercept Delete/Backspace for lines that parse as a proxy credential (not random notes). */
function isProxyListLineForDeleteIntercept(trimmed: string): boolean {
  if (!trimmed) return false;
  return parseProxyConnectionString(stripProxyConnectionScheme(trimmed)) !== null;
}

/** One blank line between each proxy in the editor for readability. */
function joinProxyLinesWithBlankSeparators(lines: readonly string[]): string {
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
  return nonEmpty.join('\n\n');
}

/** Normalize pasted/API text to single newlines between entries → blank line between proxies. */
function normalizeProxyListEditorText(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return joinProxyLinesWithBlankSeparators(lines);
}

function togglePendingDeleteForSelection(view: EditorView, prevKeys: readonly string[]): string[] {
  const set = new Set(prevKeys);
  const from = view.state.selection.main.from;
  const to = view.state.selection.main.to;
  const startLine = view.state.doc.lineAt(from).number;
  const endLine = view.state.doc.lineAt(to).number;
  for (let n = startLine; n <= endLine; n++) {
    const t = view.state.doc.line(n).text.trim();
    if (!t) continue;
    if (!isProxyListLineForDeleteIntercept(t)) continue;
    if (set.has(t)) set.delete(t);
    else set.add(t);
  }
  return Array.from(set);
}

function prunePendingDeleteKeys(text: string, prevKeys: readonly string[]): string[] {
  const lineSet = new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  return prevKeys.filter((k) => lineSet.has(k));
}

function getActiveLines(text: string, pendingDelete: ReadonlySet<string>): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !pendingDelete.has(l));
}

/** All non-empty lines in the editor (includes lines marked for removal — they stay visible). */
function countCredentialLinesInEditor(text: string): number {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
}

function prunePendingHighlightKeys(text: string, prevKeys: readonly string[]): string[] {
  const lineSet = new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  return prevKeys.filter((k) => lineSet.has(k));
}

function prunePendingInvalidKeys(text: string, prevKeys: readonly string[]): string[] {
  const lineSet = new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  return prevKeys.filter((k) => lineSet.has(k));
}

function sessionTypeToConnectionType(sessionType: string): 'sticky' | 'random' | 'rotation' | null {
  if (sessionType === 'Rotating session') return 'rotation';
  if (sessionType === 'Random session') return 'random';
  return 'sticky';
}

function normalizeVoidHost(host: string): string {
  if (!host) return 'void-proxy.com';
  const h = host.toLowerCase();
  if (h === 'void-proxy.com' || h.includes('void-proxy') || h === '172.65.224.137') return 'void-proxy.com';
  return host;
}

/** After API returns raw lines, apply session/region/TTL/protocol like legacy OrderDetailsModal + ProxyGenerator. */
function applyGeneratorOptionsToCredentials(
  lines: string[],
  sessionType: string,
  /** Uppercase region code (US, DE) or '' for worldwide / no -region- */
  selectedRegionCode: string,
  ttlSeconds: number,
  protocol: ProxyProtocol
): string[] {
  const connectionType = sessionTypeToConnectionType(sessionType);
  const region =
    selectedRegionCode.trim() === '' ? undefined : selectedRegionCode.trim().toLowerCase();
  const ttlMin =
    ttlSeconds >= 60
      ? Math.max(1, Math.min(1440, Math.floor(ttlSeconds / 60)))
      : undefined;

  return lines.map((line) => {
    const parsed = parseProxyConnectionString(line);
    if (!parsed) return line;
    const host = normalizeVoidHost(parsed.host);
    const sessionName = connectionType === 'sticky' ? generateShortSessionId() : undefined;
    return generateProxyConnectionString({
      baseUsername: parsed.baseUsername,
      password: parsed.password,
      host,
      port: parsed.port,
      connectionType,
      sessionName,
      region: region || undefined,
      city: undefined,
      ttl: ttlMin,
      protocol,
    });
  });
}

/**
 * GET /sub-credentials may return rows with credentialsString null until Redis/Void sync.
 * generateSubCredentials returns only the strings from this request (length = count), not the full list.
 * Align generated[] to the last `genLen` rows (new/restored batch), after preferring credentialsString from each row.
 */
function mergeRawCredentialLines(
  rows: Array<{ credentialsString?: string | null }> | undefined,
  fromGenerate: string[] | undefined
): string[] {
  const gen = (fromGenerate ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (!rows?.length) return gen;

  const genLen = gen.length;
  const batchStart = Math.max(0, rows.length - genLen);
  const out: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const fromRow = rows[i]?.credentialsString;
    if (typeof fromRow === 'string' && fromRow.trim()) {
      out.push(fromRow.trim());
      continue;
    }
    if (genLen > 0 && i >= batchStart) {
      const gi = i - batchStart;
      if (gi >= 0 && gi < genLen && gen[gi]) out.push(gen[gi]);
    }
  }
  if (out.length === 0 && gen.length) return gen.filter((line) => isShowableVoidProxyCredentialLine(line));
  return out.filter((line) => isShowableVoidProxyCredentialLine(line));
}

/** First GB proxy order (not unlimited) for sub-credentials generation */
function findFirstGbOrder(orders: Order[]): Order | null {
  for (const o of orders) {
    if (toServiceType(o.serviceType) !== ServiceType.Proxies) continue;
    const baseUnit = o.baseUnit ?? '';
    const displayUnit = o.displayUnit ?? '';
    if (baseUnit === 'second' && displayUnit === 'hour') continue;
    return o;
  }
  return null;
}

interface ProxyGeneratorProps {
  orderIdFromOrderList?: number | null;
  onBackToOrders?: () => void;
  onOpenProxyCheckerWithProxies?: (proxies: string) => void;
}

const ProxyGenerator: React.FC<ProxyGeneratorProps> = ({ orderIdFromOrderList = null, onBackToOrders, onOpenProxyCheckerWithProxies }) => {
  const { t } = useTranslation('app');
  const [sessionType, setSessionType] = useState('Sticky session');
  const sessionTypeOptions = ['Sticky session', 'Random session', 'Rotating session'] as const;
  const [proxyCount, setProxyCount] = useState(1);
  /** Пустая строка = весь мир (без -region-), иначе код региона в верхнем регистре (как legacy OrderDetailsModal). */
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const regionsInitRef = useRef(false);
  const [protocol, setProtocol] = useState<ProxyProtocol>('none');
  const [ttl, setTtl] = useState(3600);
  const [generatedProxies, setGeneratedProxies] = useState('');
  /** Trimmed lines from the last Generate batch — CodeMirror lines matching these render green until Save or reload. */
  const [pendingHighlightKeys, setPendingHighlightKeys] = useState<string[]>([]);
  /** Trimmed lines marked for removal (red strikethrough) until Save. */
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  /** Trimmed lines that failed validation on last Save attempt (amber highlight). */
  const [pendingInvalidLineKeys, setPendingInvalidLineKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [subCredsLimit, setSubCredsLimit] = useState<number>(0);
  const [subCredsCount, setSubCredsCount] = useState<number>(0);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [format, setFormat] = useState('username:password@host:port');
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  const formats = ['username:password@host:port', 'host:port:username:password'];

  const protocolOptions = useMemo(
    () =>
      [
        { value: 'none', label: t('proxyGenerator.protocolNone') },
        { value: 'http', label: t('proxyGenerator.protocolHttp') },
        { value: 'socks', label: t('proxyGenerator.protocolSocks5') },
      ] as const,
    [t]
  );

  const gbOrder = useMemo(() => findFirstGbOrder(orders), [orders]);
  const effectiveOrderId = orderIdFromOrderList ?? gbOrder?.id ?? null;
  const maxToGenerate = Math.max(0, subCredsLimit - subCredsCount);
  const canGenerate = effectiveOrderId != null && maxToGenerate > 0;
  const showBackButton = orderIdFromOrderList != null && typeof onBackToOrders === 'function';

  const editorViewRef = useRef<EditorView | null>(null);
  const pendingCompartmentRef = useRef(new Compartment());
  const pendingDeleteKeysRef = useRef<string[]>([]);
  pendingDeleteKeysRef.current = pendingDeleteKeys;

  /** CodeMirror `Prec.highest` keymap calls this each render via ref (avoids stale useMemo). */
  const proxyDeleteInterceptRef = useRef<
    (view: EditorView, opts: { isRepeat: boolean; source: string }) => boolean
  >(() => false);

  proxyDeleteInterceptRef.current = (view, opts) => {
    try {
      const sel = view.state.selection.main;
      if (!sel.empty) {
        setPendingDeleteKeys((prev) => togglePendingDeleteForSelection(view, prev));
        return true;
      }

      const line = view.state.doc.lineAt(sel.from);
      const trimmed = line.text.trim();
      const stripped = trimmed ? stripProxyConnectionScheme(trimmed) : '';
      const parsed = trimmed ? parseProxyConnectionString(stripped) : null;
      const isProxyLine = parsed !== null;

      if (PROXY_DELETE_DEBUG && trimmed) {
        console.log('[proxyListDelete]', opts.source, { lineNo: line.number, parseOk: isProxyLine, repeat: opts.isRepeat });
      }

      if (!trimmed || !isProxyLine) return false;

      const pending = pendingDeleteKeysRef.current;
      const marked = pending.includes(trimmed);

      if (marked && opts.isRepeat) return true;
      if (marked && !opts.isRepeat) {
        setPendingDeleteKeys((prev) => prev.filter((k) => k !== trimmed));
        return true;
      }
      setPendingDeleteKeys((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      return true;
    } catch (err) {
      console.error('[proxyListDelete] intercept error', err);
      return false;
    }
  };

  const cmExtensions = useMemo(
    () => [
      Prec.highest(
        keymap.of([
          {
            key: 'Backspace',
            run: (view) => proxyDeleteInterceptRef.current(view, { isRepeat: false, source: 'keymap:Backspace' }),
          },
          {
            key: 'Delete',
            run: (view) => proxyDeleteInterceptRef.current(view, { isRepeat: false, source: 'keymap:Delete' }),
          },
        ])
      ),
      EditorView.lineWrapping,
      proxyListEditorTheme,
      pendingCompartmentRef.current.of(
        proxyLineDecorationsExtension({
          pendingHighlight: new Set(),
          pendingDelete: new Set(),
          invalidLines: new Set(),
        })
      ),
    ],
    []
  );

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: pendingCompartmentRef.current.reconfigure(
        proxyLineDecorationsExtension({
          pendingHighlight: new Set(pendingHighlightKeys),
          pendingDelete: new Set(pendingDeleteKeys),
          invalidLines: new Set(pendingInvalidLineKeys),
        })
      ),
    });
  }, [pendingHighlightKeys, pendingDeleteKeys, pendingInvalidLineKeys]);

  /** Список регионов как в legacy UI: GET /public/available-regions, иначе VOID_PROXY_COUNTRIES. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCountries(true);
      try {
        const apiData = await publicApi.getAvailableRegions();
        const fromApi = apiData?.regions?.length
          ? apiData.regions.map((r: string) => String(r).toUpperCase())
          : [];
        const list = fromApi.length > 0 ? fromApi : VOID_PROXY_COUNTRIES.map((c) => c.code.toUpperCase());
        if (cancelled) return;
        setAvailableCountries(list);
        if (!regionsInitRef.current) {
          regionsInitRef.current = true;
          setSelectedRegion('');
        } else {
          setSelectedRegion((prev) => {
            if (prev === '' || list.includes(prev)) return prev;
            return list[0] ?? '';
          });
        }
      } catch {
        if (cancelled) return;
        const list = VOID_PROXY_COUNTRIES.map((c) => c.code.toUpperCase());
        setAvailableCountries(list);
        if (!regionsInitRef.current) {
          regionsInitRef.current = true;
          setSelectedRegion('');
        } else {
          setSelectedRegion((prev) => {
            if (prev === '' || list.includes(prev)) return prev;
            return list[0] ?? '';
          });
        }
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPendingHighlightKeys([]);
    setPendingDeleteKeys([]);
    setPendingInvalidLineKeys([]);
    if (orderIdFromOrderList != null) {
      setOrdersLoading(true);
      setSubCredsLimit(0);
      setSubCredsCount(0);
      ordersApi
        .getSubCredentials(orderIdFromOrderList)
        .then((res) => {
          if (!cancelled) {
            if (res.success) {
              setSubCredsLimit(res.limit);
              setSubCredsCount(res.data.length);
              const existing = normalizeProxyListEditorText(
                filterVoidProxyCredentialLinesForUi(
                  res.formattedLines?.length
                    ? res.formattedLines.join('\n')
                    : res.data.map((r) => r.credentialsString).filter(Boolean).join('\n')
                )
              );
              setPendingDeleteKeys([]);
              setPendingInvalidLineKeys([]);
              setGeneratedProxies(existing);
            } else {
              setSubCredsLimit(0);
              setSubCredsCount(0);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSubCredsLimit(0);
            setSubCredsCount(0);
          }
        })
        .finally(() => !cancelled && setOrdersLoading(false));
      return () => { cancelled = true; };
    }
    ordersApi
      .getOrders({ page: 1, pageSize: 500 })
      .then((res) => {
        if (cancelled) return;
        const list = res.orders;
        setOrders(list);
        const order = findFirstGbOrder(list);
        if (order) {
          ordersApi
            .getSubCredentials(order.id)
            .then((res) => {
              if (!cancelled && res.success) {
                setSubCredsLimit(res.limit);
                setSubCredsCount(res.data.length);
                const existing = normalizeProxyListEditorText(
                  filterVoidProxyCredentialLinesForUi(
                    res.formattedLines?.length
                      ? res.formattedLines.join('\n')
                      : res.data.map((r) => r.credentialsString).filter(Boolean).join('\n')
                  )
                );
                setPendingDeleteKeys([]);
                setPendingInvalidLineKeys([]);
                setGeneratedProxies(existing);
              }
            })
            .catch(() => {});
        }
      })
      .finally(() => !cancelled && setOrdersLoading(false));
    return () => { cancelled = true; };
  }, [orderIdFromOrderList]);

  const refetchSubCredentials = async () => {
    if (effectiveOrderId == null) return;
    try {
      const res = await ordersApi.getSubCredentials(effectiveOrderId);
      if (res.success) {
        setSubCredsLimit(res.limit);
        setSubCredsCount(res.data.length);
        const text = normalizeProxyListEditorText(
          filterVoidProxyCredentialLinesForUi(
            res.formattedLines?.length
              ? res.formattedLines.join('\n')
              : res.data.map((r) => r.credentialsString).filter(Boolean).join('\n')
          )
        );
        setPendingHighlightKeys([]);
        setPendingDeleteKeys([]);
        setPendingInvalidLineKeys([]);
        setGeneratedProxies(text);
      }
    } catch {
      // ignore
    }
  };

  const generate = async () => {
    if (effectiveOrderId == null) return;
    const count = Math.min(Math.max(1, Math.floor(proxyCount)), maxToGenerate);
    if (count < 1) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await ordersApi.generateSubCredentials(effectiveOrderId, count);
      if (res.success && res.credentials?.length) {
        const ttlClamped = Math.max(TTL_SECONDS_MIN, Math.min(TTL_SECONDS_MAX, ttl));
        // apply-settings expects the full visible list in DB order (same as legacy OrderDetailsModal).
        const fullRes = await ordersApi.getSubCredentials(effectiveOrderId);
        const rawStrings = mergeRawCredentialLines(fullRes.data, res.credentials);
        const withOptions = applyGeneratorOptionsToCredentials(
          rawStrings,
          sessionType,
          selectedRegion,
          ttlClamped,
          protocol
        );
        if (withOptions.length === 0) {
          setGenerateError(t('proxyGenerator.generateEmptyLines'));
          return;
        }
        /** Local preview + green highlight until user clicks Save (apply-settings). */
        setGeneratedProxies(joinProxyLinesWithBlankSeparators(withOptions));
        setPendingDeleteKeys([]);
        setPendingInvalidLineKeys([]);
        setPendingHighlightKeys((prev) => {
          const newBatch = withOptions.slice(-count).map((s) => String(s).trim()).filter(Boolean);
          const docKeys = new Set(withOptions.map((s) => String(s).trim()).filter(Boolean));
          const prevKept = prev.filter((k) => docKeys.has(k));
          return Array.from(new Set([...prevKept, ...newBatch]));
        });
        if (fullRes.success) {
          setSubCredsLimit(fullRes.limit);
          setSubCredsCount(withOptions.length);
        } else {
          setSubCredsCount(withOptions.length);
        }
        // Do not refetch raw GET here: it can return null credentialsString and overwrite formatted lines.
      } else {
        setGenerateError('No credentials returned');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setGenerateError(err.response?.data?.message ?? err.message ?? 'Failed to generate proxies');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveList = async () => {
    if (effectiveOrderId == null) return;
    const lines = getActiveLines(generatedProxies, new Set(pendingDeleteKeys));
    const invalidKeys = getInvalidCredentialLineKeys(lines);
    if (invalidKeys.length > 0) {
      setPendingInvalidLineKeys(invalidKeys);
      setSaveError(t('proxyGenerator.saveValidationError', { count: invalidKeys.length }));
      return;
    }
    setPendingInvalidLineKeys([]);
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await ordersApi.applySubCredentialsSettings(effectiveOrderId, lines);
      if (res.success) {
        const savedText = joinProxyLinesWithBlankSeparators(lines);
        setPendingDeleteKeys([]);
        setPendingHighlightKeys([]);
        setPendingInvalidLineKeys([]);
        setGeneratedProxies(savedText);
        await refetchSubCredentials();
      } else {
        setSaveError('Failed to save list');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setSaveError(err.response?.data?.message ?? err.message ?? 'Failed to save list');
    } finally {
      setIsSaving(false);
    }
  };

  /** Hide all sub-credentials on the server and clear the editor (same as Save with an empty list). */
  const clearAllProxies = async () => {
    if (effectiveOrderId == null) return;
    if (!window.confirm(t('proxyGenerator.clearAllConfirm'))) return;
    setIsClearing(true);
    setSaveError(null);
    try {
      const res = await ordersApi.applySubCredentialsSettings(effectiveOrderId, []);
      if (res.success) {
        setPendingHighlightKeys([]);
        setPendingDeleteKeys([]);
        setPendingInvalidLineKeys([]);
        setGeneratedProxies('');
        await refetchSubCredentials();
      } else {
        setSaveError('Failed to clear list');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setSaveError(err.response?.data?.message ?? err.message ?? 'Failed to clear list');
    } finally {
      setIsClearing(false);
    }
  };

  const hasSomethingToSaveOrClear =
    generatedProxies.trim().length > 0 ||
    subCredsCount > 0 ||
    pendingDeleteKeys.length > 0 ||
    pendingHighlightKeys.length > 0;

  const editorLineCount = useMemo(
    () => countCredentialLinesInEditor(generatedProxies),
    [generatedProxies]
  );
  const pendingAddCount = pendingHighlightKeys.length;
  const pendingRemoveCount = pendingDeleteKeys.length;

  const activeProxiesText = useMemo(
    () => getActiveLines(generatedProxies, new Set(pendingDeleteKeys)).join('\n'),
    [generatedProxies, pendingDeleteKeys]
  );

  const copyToClipboard = () => {
    if (activeProxiesText) navigator.clipboard.writeText(activeProxiesText).catch(() => {});
  };

  const downloadTxt = () => {
    if (!activeProxiesText) return;
    const blob = new Blob([activeProxiesText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'proxies.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8">
      {showBackButton && (
        <div>
          <button
            type="button"
            onClick={onBackToOrders}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('proxyGenerator.backToOrders')}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('proxyGenerator.proxyConfig')}</h3>
          </div>

          {!ordersLoading && effectiveOrderId == null && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm px-4 py-3">
              {t('proxyGenerator.noGbOrder')}
            </div>
          )}

          {effectiveOrderId != null && (
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('proxyGenerator.subCredsUsed', { used: subCredsCount, limit: subCredsLimit, more: maxToGenerate })}
            </p>
          )}

          <AutoDismissAlert
            variant="danger"
            message={generateError ?? ''}
            show={!!generateError}
            onClose={() => setGenerateError(null)}
          />
          <AutoDismissAlert
            variant="danger"
            message={saveError ?? ''}
            show={!!saveError}
            onClose={() => setSaveError(null)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label={t('proxyGenerator.sessionType')}
              value={sessionType}
              onChange={setSessionType}
              options={[...sessionTypeOptions]}
            />
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {t('proxyGenerator.proxyCount')}
              </label>
              <input
                type="number"
                min={1}
                max={maxToGenerate || 1}
                value={proxyCount}
                onChange={(e) => setProxyCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm focus:border-accent-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CountrySearchDropdown
              label={t('proxyGenerator.location')}
              selectedCountry={selectedRegion}
              availableCountries={availableCountries}
              isLoadingCountries={loadingCountries}
              isDisabled={effectiveOrderId == null}
              onCountryChange={setSelectedRegion}
            />
            <CustomSelect
              label={t('proxyGenerator.protocol')}
              value={protocol}
              onChange={(v) => setProtocol(v as ProxyProtocol)}
              options={[...protocolOptions]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              {t('proxyGenerator.ttl')}
            </label>
            <input
              type="number"
              min={TTL_SECONDS_MIN}
              max={TTL_SECONDS_MAX}
              value={ttl}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isNaN(n)) {
                  setTtl(3600);
                  return;
                }
                setTtl(Math.max(TTL_SECONDS_MIN, Math.min(TTL_SECONDS_MAX, n)));
              }}
              className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm focus:border-accent-primary outline-none transition-colors"
            />
            <p className="text-[10px] text-text-muted">{t('proxyGenerator.maxTtl')}</p>
          </div>

          <button
            onClick={generate}
            disabled={isGenerating || !canGenerate}
            className="w-full py-4 bg-accent-primary text-bg-main rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isGenerating ? t('proxyGenerator.generating') : t('proxyGenerator.generateProxies')}
          </button>
        </div>

        <div className="glass-panel p-6 lg:p-8 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('proxyGenerator.generatedList')}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {typeof onOpenProxyCheckerWithProxies === 'function' && (
                <ToolbarIconWithTooltip
                  label={t('proxyGenerator.checkInProxyChecker')}
                  disabled={!activeProxiesText.trim()}
                  onClick={() =>
                    onOpenProxyCheckerWithProxies(stripProxyConnectionSchemeFromText(activeProxiesText))
                  }
                  buttonClassName="p-2 rounded-lg border border-border-main/20 bg-bg-panel hover:bg-bg-input hover:border-accent-primary/30 text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </ToolbarIconWithTooltip>
              )}
              <ToolbarIconWithTooltip
                label={t('proxyGenerator.copy')}
                disabled={!activeProxiesText}
                onClick={copyToClipboard}
                buttonClassName="p-2 hover:bg-bg-input rounded-lg text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
              </ToolbarIconWithTooltip>
              <ToolbarIconWithTooltip
                label={t('proxyGenerator.download')}
                disabled={!activeProxiesText}
                onClick={downloadTxt}
                buttonClassName="p-2 hover:bg-bg-input rounded-lg text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
              </ToolbarIconWithTooltip>
              <ToolbarIconWithTooltip
                label={t('proxyGenerator.clearAll')}
                disabled={
                  isSaving ||
                  isClearing ||
                  effectiveOrderId == null ||
                  !hasSomethingToSaveOrClear
                }
                onClick={clearAllProxies}
                buttonClassName="p-2 hover:bg-bg-input rounded-lg text-text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {isClearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </ToolbarIconWithTooltip>
              <ToolbarIconWithTooltip
                label={t('proxyGenerator.saveList')}
                disabled={isSaving || isClearing || effectiveOrderId == null}
                onClick={saveList}
                buttonClassName="p-2 hover:bg-bg-input rounded-lg text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </ToolbarIconWithTooltip>
            </div>
          </div>

          <div className="rounded-xl border border-border-main/20 overflow-hidden min-h-[200px] w-full">
            <CodeMirror
              value={generatedProxies}
              onChange={(v) => {
                setGeneratedProxies(v);
                setPendingDeleteKeys((prev) => prunePendingDeleteKeys(v, prev));
                setPendingHighlightKeys((prev) => prunePendingHighlightKeys(v, prev));
                setPendingInvalidLineKeys((prev) => prunePendingInvalidKeys(v, prev));
              }}
              theme="none"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                autocompletion: false,
                closeBrackets: false,
                searchKeymap: false,
                foldKeymap: false,
                completionKeymap: false,
                lintKeymap: false,
              }}
              placeholder={t('proxyGenerator.generatedPlaceholder')}
              minHeight="200px"
              className="text-xs font-mono w-full"
              extensions={cmExtensions}
              onCreateEditor={(view) => {
                if (PROXY_DELETE_DEBUG) {
                  console.log('[proxyListDelete] CodeMirror onCreateEditor — delete intercept extension active');
                }
                editorViewRef.current = view;
                view.dispatch({
                  effects: pendingCompartmentRef.current.reconfigure(
                    proxyLineDecorationsExtension({
                      pendingHighlight: new Set(pendingHighlightKeys),
                      pendingDelete: new Set(pendingDeleteKeys),
                      invalidLines: new Set(pendingInvalidLineKeys),
                    })
                  ),
                });
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setIsFormatOpen(!isFormatOpen)}
                className="bg-transparent text-[10px] font-bold text-text-secondary uppercase tracking-wider outline-none cursor-pointer hover:text-accent-primary transition-colors flex items-center gap-2"
              >
                {format}
                <ChevronDown className={`w-3 h-3 transition-transform ${isFormatOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFormatOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFormatOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 w-64 bg-bg-panel border border-border-main rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-1">
                        {formats.map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setFormat(f);
                              setIsFormatOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              format === f
                                ? 'bg-accent-primary/10 text-accent-primary'
                                : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <span className="text-[10px] text-text-muted normal-case tracking-wide">
              {t('proxyGenerator.proxiesCount', { count: editorLineCount })}
              {pendingAddCount > 0 && pendingRemoveCount > 0 ? (
                <span className="text-text-secondary normal-case ml-1 font-medium">
                  ({t('proxyGenerator.proxiesCountAddRemove', { add: pendingAddCount, remove: pendingRemoveCount })})
                </span>
              ) : pendingRemoveCount > 0 ? (
                <span className="text-red-400/90 normal-case ml-1 font-medium">
                  ({t('proxyGenerator.proxiesCountRemove', { n: pendingRemoveCount })})
                </span>
              ) : pendingAddCount > 0 ? (
                <span className="text-emerald-400/90 normal-case ml-1 font-medium">
                  ({t('proxyGenerator.proxiesCountAdd', { n: pendingAddCount })})
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProxyGenerator;
