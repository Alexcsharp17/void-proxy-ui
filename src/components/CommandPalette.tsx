import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Store, 
  Code, 
  FileText, 
  CheckCircle2, 
  Lock, 
  PlusCircle, 
  Zap, 
  Settings, 
  User,
  HelpCircle,
  ArrowRight,
  Command
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setSearchOpen } from '../store/slices/searchSlice';
import { setActivePage } from '../store/slices/appSlice';
import { Page } from '../types';

interface SearchItem {
  id: string;
  labelKey: string;
  categoryKey: string;
  icon: any;
  page?: Page;
}

const CommandPalette: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('app');
  const isOpen = useSelector((state: RootState) => state.search.isOpen);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: SearchItem[] = useMemo(() => [
    { id: 'overview', labelKey: 'commandPalette.overview', categoryKey: 'commandPalette.mainMenu', icon: LayoutDashboard, page: 'overview' },
    { id: 'plans', labelKey: 'commandPalette.plansPricing', categoryKey: 'commandPalette.mainMenu', icon: CreditCard },
    { id: 'deposit', labelKey: 'commandPalette.deposit', categoryKey: 'commandPalette.financials', icon: CreditCard, page: 'deposit' },
    { id: 'affiliate', labelKey: 'commandPalette.affiliateProgram', categoryKey: 'commandPalette.financials', icon: Users, page: 'affiliate' },
    { id: 'reselling', labelKey: 'commandPalette.resellingSettings', categoryKey: 'commandPalette.financials', icon: Store, page: 'reselling' },
    { id: 'api-access', labelKey: 'commandPalette.apiAccess', categoryKey: 'commandPalette.developer', icon: Code },
    { id: 'api-docs', labelKey: 'commandPalette.apiDocs', categoryKey: 'commandPalette.developer', icon: FileText },
    { id: 'proxy-checker', labelKey: 'commandPalette.proxyChecker', categoryKey: 'commandPalette.tools', icon: CheckCircle2, page: 'proxy-checker' },
    { id: 'proxy-generator', labelKey: 'commandPalette.proxyGenerator', categoryKey: 'commandPalette.tools', icon: Lock, page: 'proxy-generator' },
    { id: 'add-ons', labelKey: 'commandPalette.addOns', categoryKey: 'commandPalette.tools', icon: PlusCircle },
    { id: 'whitelabel', labelKey: 'commandPalette.whitelabel', categoryKey: 'commandPalette.tools', icon: Zap },
    { id: 'support', labelKey: 'commandPalette.support', categoryKey: 'commandPalette.system', icon: HelpCircle, page: 'support' },
    { id: 'settings', labelKey: 'commandPalette.settings', categoryKey: 'commandPalette.system', icon: Settings, page: 'settings' },
    { id: 'user', labelKey: 'commandPalette.userProfile', categoryKey: 'commandPalette.system', icon: User },
  ], []);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item => 
      t(item.labelKey).toLowerCase().includes(q) ||
      t(item.categoryKey).toLowerCase().includes(q)
    );
  }, [query, items, t]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setSearchOpen(true));
      }
      if (e.key === 'Escape') {
        dispatch(setSearchOpen(false));
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected && selected.page) {
          dispatch(setActivePage(selected.page));
          dispatch(setSearchOpen(false));
          setQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, dispatch]);

  const handleSelect = (item: SearchItem) => {
    if (item.page) {
      dispatch(setActivePage(item.page));
      dispatch(setSearchOpen(false));
      setQuery('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setSearchOpen(false))}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-bg-panel border border-border-main rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-4 border-b border-border-main flex items-center gap-3">
              <Search className="w-5 h-5 text-accent-primary" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.searchPlaceholder')}
                className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted text-lg"
              />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg-main border border-border-main text-[10px] font-bold text-text-muted">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left ${
                        index === selectedIndex 
                          ? 'bg-accent-primary/10 text-accent-primary' 
                          : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        index === selectedIndex ? 'bg-accent-primary/20' : 'bg-bg-main'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{t(item.labelKey)}</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-60">{t(item.categoryKey)}</p>
                      </div>
                      {index === selectedIndex && (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                  <p className="text-sm font-bold text-text-primary">{t('commandPalette.noResults')}</p>
                  <p className="text-xs text-text-secondary mt-1">{t('commandPalette.tryElse')}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-bg-main/50 border-t border-border-main flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-bg-panel border border-border-main">↑↓</span>
                  {t('commandPalette.navigate')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-bg-panel border border-border-main">Enter</span>
                  {t('commandPalette.select')}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-bg-panel border border-border-main">Esc</span>
                {t('commandPalette.close')}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
