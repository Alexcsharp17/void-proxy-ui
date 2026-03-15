import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, CreditCard, Users, Store, PlusCircle,
  CheckCircle2, Lock, Settings, LogOut, Search, Command, HelpCircle 
} from 'lucide-react';
import { setSearchOpen } from '../store/slices/searchSlice';
import SidebarItem from './SidebarItem';
import { useAuth } from '../contexts/AuthContext';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('app');
  const { logout } = useAuth();

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
  };

  const handlePageClick = (page: Page) => {
    onPageChange(page);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="p-8">
        <img src="/void.svg" alt="Void" className="h-8 w-auto shrink-0" />
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => dispatch(setSearchOpen(true))}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-main border border-border-main/20 text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 transition-colors group text-left"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest flex-1">{t('sidebar.searchPlaceholder')}</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-panel border border-border-main text-[8px] font-bold text-text-muted group-hover:border-accent-primary/30 transition-colors">
            <Command className="w-2 h-2" />
            <span>K</span>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 mt-6 px-4">{t('sidebar.mainMenu')}</div>
        <SidebarItem 
          icon={LayoutDashboard} 
          label={t('sidebar.overview')} 
          active={activePage === 'overview'} 
          onClick={() => handlePageClick('overview')}
        />
        <SidebarItem 
          icon={CreditCard} 
          label={t('sidebar.plansPricing')} 
          active={activePage === 'plans'}
          onClick={() => handlePageClick('plans')}
        />
        <SidebarItem 
          icon={PlusCircle} 
          label={t('sidebar.addOns')} 
          active={activePage === 'addons'}
          onClick={() => handlePageClick('addons')}
        />
        
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 mt-8 px-4">{t('sidebar.financials')}</div>
        <SidebarItem 
          icon={CreditCard} 
          label={t('sidebar.deposit')} 
          active={activePage === 'deposit'}
          onClick={() => handlePageClick('deposit')}
        />
        <SidebarItem 
          icon={Users} 
          label={t('sidebar.affiliate')} 
          active={activePage === 'affiliate'}
          onClick={() => handlePageClick('affiliate')}
        />
        <SidebarItem 
          icon={Store} 
          label={t('sidebar.reselling')} 
          active={activePage === 'reselling'}
          onClick={() => handlePageClick('reselling')}
        />

        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 mt-8 px-4">{t('sidebar.tools')}</div>
        <SidebarItem 
          icon={CheckCircle2} 
          label={t('sidebar.proxyChecker')} 
          active={activePage === 'proxy-checker'}
          onClick={() => handlePageClick('proxy-checker')}
        />
        <SidebarItem 
          icon={Lock} 
          label={t('sidebar.proxyGenerator')} 
          active={activePage === 'proxy-generator'}
          onClick={() => handlePageClick('proxy-generator')}
        />
        <SidebarItem 
          icon={Settings} 
          label={t('sidebar.settings')} 
          active={activePage === 'settings'}
          onClick={() => handlePageClick('settings')}
        />

        {/* Developer section hidden for now
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 mt-8 px-4">{t('sidebar.developer')}</div>
        <SidebarItem icon={Code} label={t('sidebar.apiAccess')} />
        <SidebarItem icon={FileText} label={t('sidebar.apiDocs')} />
        */}

        <SidebarItem 
          icon={HelpCircle} 
          label={t('sidebar.support')} 
          active={activePage === 'support'}
          onClick={() => handlePageClick('support')}
        />
      </nav>

      <div className="p-6 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-bg-panel text-red-400 text-sm font-semibold hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
        >
          <LogOut className="w-4 h-4" />
          {t('sidebar.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
