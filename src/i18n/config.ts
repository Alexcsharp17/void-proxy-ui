import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEn from '../locales/en/common.json';
import commonRu from '../locales/ru/common.json';
import authEn from '../locales/en/auth.json';
import authRu from '../locales/ru/auth.json';
import homeEn from '../locales/en/home.json';
import homeRu from '../locales/ru/home.json';
import proxiesEn from '../locales/en/proxies.json';
import proxiesRu from '../locales/ru/proxies.json';
import ordersEn from '../locales/en/orders.json';
import ordersRu from '../locales/ru/orders.json';
import profileEn from '../locales/en/profile.json';
import profileRu from '../locales/ru/profile.json';
import navbarEn from '../locales/en/navbar.json';
import navbarRu from '../locales/ru/navbar.json';
import footerEn from '../locales/en/footer.json';
import footerRu from '../locales/ru/footer.json';
import legalEn from '../locales/en/legal.json';
import legalRu from '../locales/ru/legal.json';
import freeproxiesEn from '../locales/en/freeproxies.json';
import freeproxiesRu from '../locales/ru/freeproxies.json';
import apidocsEn from '../locales/en/apidocs.json';
import apidocsRu from '../locales/ru/apidocs.json';
import channelsEn from '../locales/en/channels.json';
import channelsRu from '../locales/ru/channels.json';
import accountsEn from '../locales/en/accounts.json';
import accountsRu from '../locales/ru/accounts.json';
import appEn from '../locales/en/app.json';
import appRu from '../locales/ru/app.json';

interface UserWithLanguage {
  language?: 'en' | 'ru';
}

let getUserFn: (() => UserWithLanguage | null) | null = null;

export function setGetUserFunction(fn: () => UserWithLanguage | null) {
  getUserFn = fn;
  const detected = detectLanguage();
  if (detected !== i18n.language) {
    i18n.changeLanguage(detected);
  }
}

function detectLanguage(): string {
  const user = getUserFn?.();
  if (user?.language && (user.language === 'en' || user.language === 'ru')) {
    return user.language;
  }
  const stored = localStorage.getItem('i18nextLng');
  if (stored && (stored === 'ru' || stored === 'en')) {
    return stored;
  }
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  if (browserLang === 'ru' || browserLang === 'en') {
    return browserLang;
  }
  return 'en';
}

export function initI18n() {
  const lng = detectLanguage();
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        common: commonEn as Record<string, unknown>,
        auth: authEn as Record<string, unknown>,
        home: homeEn as Record<string, unknown>,
        proxies: proxiesEn as Record<string, unknown>,
        orders: ordersEn as Record<string, unknown>,
        profile: profileEn as Record<string, unknown>,
        navbar: navbarEn as Record<string, unknown>,
        footer: footerEn as Record<string, unknown>,
        legal: legalEn as Record<string, unknown>,
        freeproxies: freeproxiesEn as Record<string, unknown>,
        apidocs: apidocsEn as Record<string, unknown>,
        channels: channelsEn as Record<string, unknown>,
        accounts: accountsEn as Record<string, unknown>,
        app: appEn as Record<string, unknown>,
      },
      ru: {
        common: commonRu as Record<string, unknown>,
        auth: authRu as Record<string, unknown>,
        home: homeRu as Record<string, unknown>,
        proxies: proxiesRu as Record<string, unknown>,
        orders: ordersRu as Record<string, unknown>,
        profile: profileRu as Record<string, unknown>,
        navbar: navbarRu as Record<string, unknown>,
        footer: footerRu as Record<string, unknown>,
        legal: legalRu as Record<string, unknown>,
        freeproxies: freeproxiesRu as Record<string, unknown>,
        apidocs: apidocsRu as Record<string, unknown>,
        channels: channelsRu as Record<string, unknown>,
        accounts: accountsRu as Record<string, unknown>,
        app: appRu as Record<string, unknown>,
      },
    },
    lng,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'home',
      'proxies',
      'orders',
      'profile',
      'navbar',
      'footer',
      'legal',
      'freeproxies',
      'apidocs',
      'channels',
      'accounts',
      'app',
    ],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
  return i18n;
}

export function updateLanguage(language: 'en' | 'ru') {
  i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);
}

export default i18n;
