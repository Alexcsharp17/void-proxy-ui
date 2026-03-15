import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { X, Globe, MessageSquare } from 'lucide-react';
import { RootState } from './store';
import {
  setActivePage,
  setTheme,
  setLocale,
  setMobileMenuOpen,
  setIsDesktop,
} from './store/slices/appSlice';
import i18n from './i18n/config';
import { useAuth } from './contexts/AuthContext';
import { useDashboardData } from './hooks/useDashboardData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import ResellingPage from './components/ResellingPage';
import AffiliatePage from './components/AffiliatePage';
import ProxyChecker from './components/ProxyChecker';
import ProxyGenerator from './components/ProxyGenerator';
import DepositPage from './components/DepositPage';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import CommandPalette from './components/CommandPalette';
import type { Order } from './types';

export default function App() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { activePage, theme, isMobileMenuOpen, isDesktop } = useSelector((state: RootState) => state.app);
  const { dashboardData, orders: ordersNoIcon, loading: dataLoading, balance, currency, showDeletionBanner, deletionCountdown } = useDashboardData();

  const orders: Order[] = useMemo(
    () =>
      ordersNoIcon.map((o) => ({
        id: o.id,
        product: o.product,
        quantity: o.quantity,
        status: o.status,
        date: o.date,
        price: o.price,
        timeAgo: o.timeAgo,
        icon: o.productType === 'proxies' ? <Globe className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />,
      })),
    [ordersNoIcon]
  );

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    const lng = i18n.language?.split('-')[0];
    if (lng === 'en' || lng === 'ru') dispatch(setLocale(lng));
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      dispatch(setIsDesktop(window.innerWidth >= 1024));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const didSetDefaultPage = useRef(false);
  useEffect(() => {
    if (user && !didSetDefaultPage.current) {
      didSetDefaultPage.current = true;
      dispatch(setActivePage('overview'));
    }
  }, [user, dispatch]);

  return (
    <div className="min-h-screen flex bg-bg-main text-text-primary font-sans selection:bg-accent-primary/30 overflow-hidden">
      <CommandPalette />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-bg-panel border-r border-border-main flex-col h-screen shrink-0 overflow-y-auto no-scrollbar">
        <Sidebar 
          activePage={activePage} 
          onPageChange={(page) => dispatch(setActivePage(page))} 
        />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && !isDesktop && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-bg-panel border-r border-border-main flex flex-col z-[70] overflow-y-auto no-scrollbar"
            >
              <div className="absolute top-4 right-4 lg:hidden">
                <button onClick={() => dispatch(setMobileMenuOpen(false))} className="p-2 hover:bg-bg-panel/50 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar 
                activePage={activePage} 
                onPageChange={(page) => dispatch(setActivePage(page))}
                onClose={() => dispatch(setMobileMenuOpen(false))}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col min-w-0">
        <Header
          activePage={activePage}
          onMenuClick={() => dispatch(setMobileMenuOpen(true))}
          onSettingsClick={() => dispatch(setActivePage('settings'))}
          user={user ?? undefined}
          balance={balance}
          currency={currency}
        />

        <div className="flex-1 flex flex-col p-6 lg:p-10 space-y-8">
          {activePage === 'overview' ? (
            <DashboardOverview
              dashboardData={dashboardData}
              orders={orders}
              loading={dataLoading}
              showDeletionBanner={showDeletionBanner}
              deletionCountdown={deletionCountdown}
              onDepositClick={() => dispatch(setActivePage('deposit'))}
            />
          ) : activePage === 'reselling' ? (
            <ResellingPage />
          ) : activePage === 'affiliate' ? (
            <AffiliatePage />
          ) : activePage === 'proxy-checker' ? (
            <ProxyChecker />
          ) : activePage === 'proxy-generator' ? (
            <ProxyGenerator />
          ) : activePage === 'deposit' ? (
            <DepositPage />
          ) : activePage === 'support' ? (
            <SupportPage />
          ) : (
            <SettingsPage theme={theme} setTheme={(t) => dispatch(setTheme(t))} />
          )}
        </div>
      </main>
    </div>
  );
}
