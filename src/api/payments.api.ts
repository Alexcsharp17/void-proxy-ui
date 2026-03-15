/**
 * Payments API: providers, create-invoice (deposit).
 */
import { api } from './client';

export type PaymentProviderName = 'cryptomus' | 'lolzteam' | 'heleket';

export interface PaymentProvider {
  name: PaymentProviderName;
  enabled: boolean;
  currencies?: string[];
}

export interface CreateInvoiceRequest {
  amount: number;
  currency: string;
  order_id?: string;
  url_return?: string;
  url_callback?: string;
  description?: string;
  provider?: PaymentProviderName;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice: {
    id?: string | number;
    uuid?: string;
    amount: number;
    currency: string;
    status: string;
    paymentUrl?: string;
    order_id?: string;
    created_at?: string;
    expired_at?: string;
  };
  message: string;
}

/** One item from balance history (ledger entry or invoice). */
export interface BalanceHistoryItem {
  id: string;
  type: 'ledger' | 'invoice';
  amount: number;
  currency: string;
  description: string;
  status?: string;
  createdAt: string;
  paymentUrl?: string;
  expiredAt?: string;
  isExpired?: boolean;
  uuid?: string;
  referenceId?: string;
  orderId?: string;
  productName?: string;
}

export interface BalanceHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetBalanceHistoryResponse {
  success: boolean;
  data: BalanceHistoryItem[];
  pagination: BalanceHistoryPagination;
  message: string;
}

export const paymentsApi = {
  async getProviders(): Promise<{ success: boolean; providers: PaymentProvider[]; message?: string }> {
    const { data } = await api.get<{ success: boolean; providers: PaymentProvider[]; message?: string }>('/payments/providers');
    return data;
  },

  async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#deposit` : undefined;
    const { data } = await api.post<CreateInvoiceResponse>('/payments/create-invoice', {
      ...request,
      url_return: request.url_return ?? returnUrl,
    });
    return data;
  },

  /** Combined balance history (ledger + invoices) with pagination. Same as old UI getBalanceHistory. */
  async getBalanceHistory(
    page: number = 1,
    limit: number = 20,
    referralOnly?: boolean
  ): Promise<GetBalanceHistoryResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (referralOnly === true) params.set('referralOnly', 'true');
    const { data } = await api.get<GetBalanceHistoryResponse>(`/payments/balance-history?${params.toString()}`);
    return data;
  },
};
