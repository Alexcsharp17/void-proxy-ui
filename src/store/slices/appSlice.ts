import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Page = 'overview' | 'reselling' | 'affiliate' | 'settings' | 'proxy-checker' | 'proxy-generator' | 'deposit' | 'support';

export type Locale = 'en' | 'ru';

interface AppState {
  activePage: Page;
  theme: 'light' | 'dark';
  locale: Locale;
  isMobileMenuOpen: boolean;
  isDesktop: boolean;
}

const initialState: AppState = {
  activePage: 'overview',
  theme: 'dark',
  locale: 'en',
  isMobileMenuOpen: false,
  isDesktop: true,
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
  },
});

export const { setActivePage, setTheme, setLocale, setMobileMenuOpen, setIsDesktop } = appSlice.actions;
export default appSlice.reducer;
