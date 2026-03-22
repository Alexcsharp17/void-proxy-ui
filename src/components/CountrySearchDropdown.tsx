import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, Check } from 'lucide-react';
import { getCountryByCode, type VoidProxyCountry } from '../utils/voidProxyCountries';

export interface CountrySearchDropdownProps {
  label?: string;
  /** Uppercase ISO code, e.g. US, GB — пустая строка = «весь мир» без -region- */
  selectedCountry: string;
  availableCountries: string[];
  isLoadingCountries: boolean;
  isDisabled?: boolean;
  onCountryChange: (countryCodeUpper: string) => void;
}

function getCountryDisplayName(
  countryInfo: VoidProxyCountry | undefined,
  countryCode: string,
  worldwideLabel: string
): string {
  if (countryCode === '') return worldwideLabel;
  if (!countryInfo) return countryCode;
  if (countryInfo.name === 'United States') return 'USA';
  if (countryInfo.name === 'United Kingdom') return 'UK';
  return countryInfo.name;
}

/**
 * Дропдаун стран с поиском по названию и коду — логика как в legacy ui/CountryDropdown.tsx.
 */
const CountrySearchDropdown: React.FC<CountrySearchDropdownProps> = ({
  label,
  selectedCountry,
  availableCountries,
  isLoadingCountries,
  isDisabled = false,
  onCountryChange,
}) => {
  const { t } = useTranslation('app');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const worldwideLabel = t('proxyGenerator.worldwide');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const withWorldwide = ['', ...availableCountries];

  const filteredCountries = withWorldwide.filter((code) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (code === '') {
      return worldwideLabel.toLowerCase().includes(q) || 'worldwide'.includes(q);
    }
    const info = getCountryByCode(code);
    return info
      ? info.name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
      : code.toLowerCase().includes(q);
  });

  const handleSelect = (code: string) => {
    onCountryChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedInfo =
    selectedCountry === '' ? null : getCountryByCode(selectedCountry);

  if (isLoadingCountries) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</label>
        )}
        <div className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm text-text-muted opacity-70">
          {t('proxyGenerator.loadingCountries')}
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="space-y-2 relative z-[10001]">
      {label && (
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</label>
      )}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) setIsOpen(!isOpen);
        }}
        className={`w-full bg-bg-input border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all outline-none ${
          isOpen && !isDisabled
            ? 'border-accent-primary/60 ring-2 ring-accent-primary/20'
            : 'border-border-main/20 hover:border-accent-primary/50'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedCountry === '' ? (
            <>
              <span className="text-base shrink-0">🌍</span>
              <span className="text-text-primary truncate">{worldwideLabel}</span>
            </>
          ) : selectedInfo ? (
            <>
              <span className="text-base shrink-0">{selectedInfo.flag}</span>
              <span className="text-text-primary truncate">
                {getCountryDisplayName(selectedInfo, selectedCountry, worldwideLabel)}
              </span>
            </>
          ) : (
            <span className="text-text-primary truncate">{selectedCountry}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !isDisabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearchQuery(''); }} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-bg-panel border border-border-main rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[280px]">
            <div className="p-2 border-b border-border-main/30 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('proxyGenerator.countrySearchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-input border border-border-main/30 rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[220px] no-scrollbar p-1">
              {filteredCountries.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-text-muted">
                  {t('proxyGenerator.noCountriesFound')}
                </div>
              ) : (
                filteredCountries.map((code) => {
                  const info = code === '' ? null : getCountryByCode(code);
                  const selected = code === selectedCountry;
                  const labelText = getCountryDisplayName(info ?? undefined, code, worldwideLabel);
                  return (
                    <button
                      key={code === '' ? '__worldwide__' : code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                        selected
                          ? 'bg-accent-primary/15 text-accent-primary border-l-2 border-accent-primary'
                          : 'text-text-secondary hover:bg-bg-main hover:text-text-primary border-l-2 border-transparent'
                      }`}
                    >
                      {code === '' ? (
                        <span className="text-lg shrink-0 w-6 text-center">🌍</span>
                      ) : info ? (
                        <span className="text-lg shrink-0 w-6 text-center">{info.flag}</span>
                      ) : (
                        <span className="w-6 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{labelText}</span>
                      {selected && <Check className="w-4 h-4 shrink-0 text-accent-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CountrySearchDropdown;
