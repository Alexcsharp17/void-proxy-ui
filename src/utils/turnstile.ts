/**
 * Turnstile is disabled on localhost and when VITE_DISABLE_TURNSTILE is true.
 * On production (non-localhost) it protects auth pages when configured.
 */
export function isTurnstileDisabled(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const envDisable = import.meta.env?.VITE_DISABLE_TURNSTILE === 'true';
  return isLocalhost || envDisable;
}

export function getTurnstileSiteKey(): string {
  const key = import.meta.env?.VITE_TURNSTILE_SITE_KEY;
  return typeof key === 'string' && key ? key : '0x4AAAAAAB3psFKWSOnZIl5T';
}
