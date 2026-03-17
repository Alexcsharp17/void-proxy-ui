/**
 * Referral code from URL: save to cookie on any page load so it persists
 * when user navigates to /register later (same as old UI).
 */
const REFERRAL_COOKIE_NAME = 'ref';
const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

function normalizeReferralCode(value: string): string {
  return value.trim();
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');
  for (const raw of parts) {
    const part = raw.trim();
    if (part.startsWith(prefix)) {
      const v = part.substring(prefix.length);
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = Math.max(1, Math.floor(maxAgeDays * 24 * 60 * 60));
  const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
    isHttps ? 'Secure' : '',
  ].filter(Boolean).join('; ');
  document.cookie = cookie;
}

export function getReferralFromUrlSearch(search: string): string | null {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const ref = params.get('ref');
    if (!ref) return null;
    const normalized = normalizeReferralCode(ref);
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

export function getReferralFromCookie(): string | null {
  const v = getCookie(REFERRAL_COOKIE_NAME);
  if (!v) return null;
  const normalized = normalizeReferralCode(v);
  return normalized.length ? normalized : null;
}

/** Save ref to cookie when URL contains ref (so /register can use it later). */
export function saveReferralToCookie(referralCode: string): void {
  const normalized = normalizeReferralCode(referralCode);
  if (!normalized) return;
  setCookie(REFERRAL_COOKIE_NAME, normalized, REFERRAL_COOKIE_MAX_AGE_DAYS);
}
