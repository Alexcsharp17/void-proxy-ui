import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Page = 'overview' | 'reselling' | 'affiliate' | 'settings' | 'proxy-checker' | 'proxy-generator' | 'deposit' | 'support' | 'addons' | 'plans' | 'purchase';

export type Locale = 'en' | 'ru';

const THEME_STORAGE_KEY = 'void-ui-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

function getInitialTheme(): 'light' | 'dark' {
  return getStoredTheme() ?? getSystemTheme();
}

export type PurchaseSegment = 'gb' | 'unlimited';

interface AppState {
  activePage: Page;
  theme: 'light' | 'dark';
  locale: Locale;
  isMobileMenuOpen: boolean;
  isDesktop: boolean;
  purchaseSegment: PurchaseSegment;
  /** When set, Proxy Generator opens with this order's sub-credentials (e.g. from Recent Orders click). */
  proxyGeneratorOrderId: number | null;
  /** When set, Proxy Checker opens with this list pre-filled (e.g. from Proxy Generator "Check in Proxy Checker"). */
  proxyCheckerInitialProxies: string | null;
}

const initialState: AppState = {
  activePage: 'overview',
  theme: getInitialTheme(),
  locale: 'en',
  isMobileMenuOpen: false,
  isDesktop: true,
  purchaseSegment: 'gb',
  proxyGeneratorOrderId: null,
  proxyCheckerInitialProxies: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActivePage: (state, action: PayloadAction<Page>) => {
      state.activePage = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, action.payload);
      }
    },
    setSystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      if (getStoredTheme() !== null) return;
      state.theme = action.payload;
    },
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    setIsDesktop: (state, action: PayloadAction<boolean>) => {
      state.isDesktop = action.payload;
    },
    setPurchaseSegment: (state, action: PayloadAction<PurchaseSegment>) => {
      state.purchaseSegment = action.payload;
    },
    setProxyGeneratorOrderId: (state, action: PayloadAction<number | null>) => {
      state.proxyGeneratorOrderId = action.payload;
    },
    setProxyCheckerInitialProxies: (state, action: PayloadAction<string | null>) => {
      state.proxyCheckerInitialProxies = action.payload;
    },
  },
});

export const { setActivePage, setTheme, setSystemTheme, setLocale, setMobileMenuOpen, setIsDesktop, setPurchaseSegment, setProxyGeneratorOrderId, setProxyCheckerInitialProxies } = appSlice.actions;
export default appSlice.reducer;
