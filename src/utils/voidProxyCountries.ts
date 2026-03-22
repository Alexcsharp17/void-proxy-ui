/**
 * Список стран для Void Proxy (коды ISO 3166-1 alpha-2, названия, флаги).
 * Совпадает с legacy ui/src/utils/voidProxyCountries.ts — для отображения регионов из GET /public/available-regions.
 */

export interface VoidProxyCountry {
  code: string;
  name: string;
  flag: string;
}

export const VOID_PROXY_COUNTRIES: VoidProxyCountry[] = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'hk', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'tw', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'at', name: 'Austria', flag: '🇦🇹' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷' },
  { code: 'cz', name: 'Czechia', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'sk', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'si', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'ee', name: 'Estonia', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvia', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'ae', name: 'UAE', flag: '🇦🇪' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'bd', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'eg', name: 'Egypt', flag: '🇪🇬' },
  { code: 'hr', name: 'Croatia', flag: '🇭🇷' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'il', name: 'Israel', flag: '🇮🇱' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { code: 'kz', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'my', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'np', name: 'Nepal', flag: '🇳🇵' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'pe', name: 'Peru', flag: '🇵🇪' },
  { code: 'ph', name: 'Philippines', flag: '🇵🇭' },
  { code: 'pk', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'rs', name: 'Serbia', flag: '🇷🇸' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'th', name: 'Thailand', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ua', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'uz', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 've', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦' },
];

export function getCountryByCode(code: string): VoidProxyCountry | undefined {
  const normalized = code.trim().toLowerCase();
  if (normalized === 'uk') {
    return VOID_PROXY_COUNTRIES.find((c) => c.code === 'gb');
  }
  return VOID_PROXY_COUNTRIES.find((c) => c.code === normalized);
}

export function getCountryCodes(): string[] {
  return VOID_PROXY_COUNTRIES.map((c) => c.code.toUpperCase());
}
