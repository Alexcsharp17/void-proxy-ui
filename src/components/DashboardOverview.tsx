import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderRow from './OrderRow';
import { Order } from '../types';

const ORDERS_PER_PAGE = 5;

interface DashboardOverviewProps {
  dashboardData: any;
  orders: Order[];
  /** Заказы грузятся отдельно от баланса — только таблица и usage ждут этот флаг. */
  loadingOrders?: boolean;
  /** Ошибка загрузки заказов (баланс мог уже подгрузиться). */
  ordersError?: string | null;
  showDeletionBanner?: boolean;
  deletionCountdown?: string;
  onDepositClick?: () => void;
  onOrderClick?: (order: Order) => void;
}

const ORDERS_THRESHOLD_COMPACT = 3;

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dashboardData,
  orders,
  loadingOrders: loading,
  ordersError = null,
  showDeletionBanner = false,
  deletionCountdown = '00:00:00',
  onDepositClick,
  onOrderClick,
}) => {
  const { t } = useTranslation('app');
  const [page, setPage] = useState(1);
  const isCompact = orders.length > ORDERS_THRESHOLD_COMPACT;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE)), [orders.length]);
  const paginatedOrders = useMemo(
    () => orders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE),
    [orders, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  /** Новый заказ приходит первым с API — показываем первую страницу */
  const firstOrderId = orders[0]?.id;
  useEffect(() => {
    setPage(1);
  }, [firstOrderId]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      const nums: number[] = [];
      for (let i = 1; i <= totalPages; i++) nums.push(i);
      return nums;
    }
    let start: number;
    let end: number;
    if (page <= 4) {
      start = 1;
      end = Math.min(maxVisible, totalPages);
    } else if (page >= totalPages - 3) {
      end = totalPages;
      start = Math.max(1, totalPages - maxVisible + 1);
    } else {
      start = page - 3;
      end = page + 3;
    }
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
  <>
    {showDeletionBanner && (
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 rounded-xl border border-red-400/30 bg-red-400/5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-400 w-6 h-6 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">{t('dashboard.deletionBannerTitle')}</span>
              <span className="text-[10px] bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded border border-red-400/20 font-mono" aria-live="polite">
                {deletionCountdown}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5">{t('dashboard.deletionBannerDesc')}</p>
          </div>
        </div>
      </motion.div>
    )}

    {/* Bento Grid Section */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Usage Overview (данные из заказов — могут прийти позже баланса) */}
      <div
        className={`bg-bg-panel/40 backdrop-blur-xl rounded-2xl border border-border-main flex flex-col ${isCompact ? 'px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5' : 'p-6 lg:p-8'} ${loading ? 'opacity-90' : ''}`}
      >
        <div className={`flex justify-between items-center ${isCompact ? 'mb-5' : 'mb-8'}`}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary">{t('dashboard.usageOverview')}</h3>
          <button className="text-accent-primary text-[10px] font-bold flex items-center gap-1 hover:underline uppercase tracking-wider">
            {t('dashboard.purchaseGb')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className={`flex flex-col md:flex-row items-center ${isCompact ? 'gap-6 lg:gap-10' : 'gap-8 lg:gap-12'} ${loading ? 'animate-pulse' : ''}`}>
          <div className="relative w-40 h-40 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="45" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="8" 
                className="text-border-main"
              />
              <circle 
                cx="50" cy="50" r="45" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray="282.7" 
                strokeDashoffset={282.7 - (282.7 * (dashboardData?.usage?.percentage ?? 0)) / 100} 
                strokeLinecap="round"
                className="text-accent-primary transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-bold text-2xl">{typeof dashboardData?.usage?.percentage === 'number' ? Number(dashboardData.usage.percentage.toFixed(2)) : 0}%</span>
              <span className="text-[8px] uppercase tracking-widest text-text-secondary font-bold">{t('dashboard.used')}</span>
            </div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-primary rounded-full shadow-[0_0_10px_var(--accent-primary)]"></div>
          </div>

          <div className={`flex-1 w-full ${isCompact ? 'space-y-2' : 'space-y-3'}`}>
            {[
              { labelKey: 'dashboard.total', value: dashboardData?.usage?.total ?? '0', unit: 'GB', color: 'text-accent-primary' },
              { labelKey: 'dashboard.used', value: dashboardData?.usage?.used ?? '0', unit: 'GB', color: 'text-orange-400' },
              { labelKey: 'dashboard.left', value: dashboardData?.usage?.left ?? '0', unit: 'GB', color: 'text-accent-primary' }
            ].map((stat) => (
              <div key={stat.labelKey} className={`flex items-center justify-between rounded-xl bg-bg-input/50 ${isCompact ? 'py-2.5 px-3' : 'p-3'}`}>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t(stat.labelKey)}</span>
                <span className={`text-sm font-bold font-mono ${stat.color}`}>
                  {stat.value} <span className="text-[10px]">{stat.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className={`bg-bg-panel/40 backdrop-blur-xl rounded-2xl border border-border-main ${isCompact ? 'px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5' : 'p-6 lg:p-8'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest text-text-primary ${isCompact ? 'mb-5' : 'mb-8'}`}>{t('dashboard.gettingStarted')}</h3>
        <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
          {[
            { step: 1, titleKey: 'dashboard.addFunds', descKey: 'dashboard.depositCrypto', onClick: onDepositClick },
            { step: 2, titleKey: 'dashboard.buyGb', descKey: 'dashboard.purchaseBandwidth', onClick: undefined },
            { step: 3, titleKey: 'dashboard.generateProxies', descKey: 'dashboard.createYourList', onClick: undefined }
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={item.onClick}
              className={`w-full flex items-center justify-between rounded-xl bg-bg-panel hover:border-accent-primary/30 transition-all group border border-transparent ${isCompact ? 'py-2.5 px-3' : 'p-4'}`}
            >
              <div className={isCompact ? 'flex items-center gap-3' : 'flex items-center gap-4'}>
                <div className={`rounded bg-accent-primary flex items-center justify-center text-[#00236d] font-bold shrink-0 ${isCompact ? 'w-6 h-6 text-[10px] shadow-md shadow-accent-primary/20' : 'w-8 h-8 text-xs shadow-lg shadow-accent-primary/20'}`}>
                  {item.step}
                </div>
                <div className="text-left min-w-0">
                  <p className={isCompact ? 'text-xs font-bold leading-tight' : 'text-sm font-bold'}>{t(item.titleKey)}</p>
                  <p className="text-[10px] text-text-secondary leading-tight">{t(item.descKey)}</p>
                </div>
              </div>
              <ArrowRight className={`text-text-muted/40 group-hover:text-accent-primary transition-colors shrink-0 ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Orders Table */}
    <div className="flex-1 bg-bg-panel/40 backdrop-blur-xl rounded-2xl border border-border-main overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border-main flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">{t('dashboard.recentOrders')}</h3>
        <div className="flex items-center bg-bg-panel rounded-lg border border-border-main/20 px-3 py-1.5 gap-2">
          <span className="text-[10px] font-bold text-text-secondary uppercase">{t('dashboard.orderType')}</span>
          <span className="text-[10px] font-bold text-text-primary uppercase">{t('dashboard.allTypes')}</span>
        </div>
      </div>
      
      <div className="flex-1">
        {loading ? (
          <div className="p-6 text-text-secondary text-sm">{t('dashboard.loadingOrders')}</div>
        ) : ordersError ? (
          <div className="p-6 text-red-400/90 text-sm">{ordersError}</div>
        ) : (
          paginatedOrders.map((order) => (
            <OrderRow key={order.id} order={order} onOrderClick={onOrderClick} />
          ))
        )}
      </div>

      <div className="p-6 border-t border-border-main flex items-center justify-between bg-bg-panel/30">
        <p className="text-[10px] font-medium text-text-secondary">
          {orders.length === 0
            ? t('dashboard.noOrders')
            : totalPages > 1
              ? `${(page - 1) * ORDERS_PER_PAGE + 1}-${Math.min(page * ORDERS_PER_PAGE, orders.length)} / ${orders.length}`
              : t('dashboard.showingItems', { count: orders.length })}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-[10px] font-bold ${
                page === n
                  ? 'bg-accent-primary text-bg-main'
                  : 'hover:bg-bg-panel text-text-secondary'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </>
  );
};

export default DashboardOverview;
