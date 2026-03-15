import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, ExternalLink, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { paymentsApi, type PaymentProvider, type PaymentProviderName, type BalanceHistoryItem } from '../api';
import { useAuth } from '../contexts/AuthContext';
import AutoDismissAlert from './AutoDismissAlert';

const CURRENCY_OPTIONS_HELEKET = ['USDT', 'USD'];

/** Only Heleket is shown for now; Cryptomus hidden. */
const ALLOWED_PROVIDERS: PaymentProviderName[] = ['heleket'];

const ITEMS_PER_PAGE = 20;

const DepositPage = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [provider] = useState<PaymentProviderName>('heleket');
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<BalanceHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .getProviders()
      .then((res) => {
        if (!cancelled && res.success && res.providers?.length) {
          const allowed = res.providers.filter(
            (p) => p.enabled && ALLOWED_PROVIDERS.includes(p.name)
          );
          setProviders(allowed);
          const first = allowed[0];
          if (first?.currencies?.length) setCurrency(first.currencies[0]);
        }
      })
      .catch(() => !cancelled && setProviders([]))
      .finally(() => !cancelled && setLoadingProviders(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    paymentsApi
      .getBalanceHistory(historyPage, ITEMS_PER_PAGE)
      .then((res) => {
        if (!cancelled && res.success) {
          setHistory(res.data);
          setHistoryTotal(res.pagination.total);
          setHistoryTotalPages(res.pagination.totalPages);
        }
      })
      .catch(() => !cancelled && setHistory([]))
      .finally(() => !cancelled && setLoadingHistory(false));
    return () => { cancelled = true; };
  }, [historyPage, refreshHistory]);

  const handleCreateInvoice = async () => {
    const num = parseFloat(amount);
    if (!user?.id) {
      setError('Please sign in to create a deposit.');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (provider !== 'heleket') {
      setError('Payment provider is not available.');
      return;
    }

    setCreating(true);
    setError(null);
    setPaymentUrl(null);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname || ''}`;
      const res = await paymentsApi.createInvoice({
        amount: num,
        currency,
        provider,
        order_id: `payment_user_${user.id}_${Date.now()}`,
        url_return: returnUrl,
        description: 'Balance top-up',
      });
      if (res.success && res.invoice?.paymentUrl) {
        setPaymentUrl(res.invoice.paymentUrl);
        window.open(res.invoice.paymentUrl, '_blank', 'noopener,noreferrer');
        setRefreshHistory((r) => r + 1);
      } else {
        setError(res.message || 'Failed to create invoice.');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message ?? err.message ?? 'Failed to create invoice.');
    } finally {
      setCreating(false);
    }
  };

  const currencyOptions = CURRENCY_OPTIONS_HELEKET;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatAmount = (item: BalanceHistoryItem) => {
    const isCredit = item.type === 'ledger' ? item.status === 'credit' : item.type === 'invoice';
    const sign = isCredit ? '+' : '-';
    const value = item.amount.toFixed(2);
    return `${sign}$${value}`;
  };

  const getTypeLabel = (item: BalanceHistoryItem) => {
    if (item.type === 'invoice') return 'Invoice';
    return item.status === 'credit' ? 'Deposit' : 'Purchase';
  };

  const filteredEntries = history.filter(
    (entry) =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.referenceId && entry.referenceId.toString().includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      <AutoDismissAlert variant="danger" message={error ?? ''} show={!!error} onClose={() => setError(null)} />

      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">New Deposit</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Create a payment invoice to add funds.</p>
          </div>
        </div>

        {loadingProviders ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading providers…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Amount (USD)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all"
                />
              </div>
              <CustomSelect
                label="Currency"
                value={currency}
                onChange={setCurrency}
                options={currencyOptions}
              />
            </div>

            <button
              onClick={handleCreateInvoice}
              disabled={creating || !amount.trim()}
              className="bg-accent-primary text-bg-main px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create Invoice'}
            </button>

            {paymentUrl && (
              <p className="text-xs text-emerald-400 flex items-center gap-2">
                Payment page opened in a new tab. Complete the payment there.
              </p>
            )}
          </>
        )}
      </div>

      <div className="glass-panel p-6 lg:p-8 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">Transactions</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
                Invoices and balance history
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by description, type, ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl bg-bg-main border border-border-main text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary/50"
            />
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12 gap-2 text-text-secondary text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border-main">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-main bg-bg-main/50">
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Type</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Description</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Amount</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Date</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary text-sm">
                        {history.length === 0
                          ? 'No transactions yet. Create an invoice above to deposit.'
                          : 'No matches for this search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => (
                      <tr key={item.id} className="border-b border-border-main/70 hover:bg-bg-main/30">
                        <td className="py-3 px-4 text-text-primary">{getTypeLabel(item)}</td>
                        <td className="py-3 px-4 text-text-primary">
                          <span>{item.description}</span>
                          {item.referenceId && (
                            <span className="block text-[10px] text-text-secondary mt-0.5">ID: #{item.referenceId}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              item.type === 'ledger' && item.status === 'credit'
                                ? 'text-emerald-500'
                                : item.type === 'ledger' && item.status === 'debit'
                                  ? 'text-red-400'
                                  : 'text-text-primary'
                            }
                          >
                            {formatAmount(item)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{formatDate(item.createdAt)}</td>
                        <td className="py-3 px-4">
                          {item.type === 'invoice' && item.paymentUrl && !item.isExpired && (
                            <a
                              href={item.paymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent-primary hover:underline text-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Pay
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-text-secondary">
                  Page {historyPage} of {historyTotalPages} · {historyTotal} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="p-2 rounded-lg border border-border-main text-text-primary hover:bg-bg-main/50 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="p-2 rounded-lg border border-border-main text-text-primary hover:bg-bg-main/50 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DepositPage;
