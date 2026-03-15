/**
 * Validates VITE_API_BASE_URL at startup. In production build, if the URL is missing
 * or invalid, we report it so the app can show a banner and avoid silent wrong requests.
 */

const URL_PATTERN = /^https?:\/\/.+/i;

function getApiBaseUrl(): string {
  const raw =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL != null
      ? String(import.meta.env.VITE_API_BASE_URL).trim()
      : '';
  return raw;
}

function isProduction(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production';
}

/** Result of validation: null = ok, string = error message for UI/console */
let validationResult: string | null = null;

export function runEnvValidation(): void {
  if (!isProduction()) return;
  const url = getApiBaseUrl();
  if (!url) {
    validationResult = 'VITE_API_BASE_URL is not set. Set it in .env or in deploy secrets.';
    console.warn('[Void Proxy UI]', validationResult);
    return;
  }
  if (!URL_PATTERN.test(url)) {
    validationResult = `VITE_API_BASE_URL is not a valid URL: "${url}". Use e.g. https://your-api.com/api/v2`;
    console.warn('[Void Proxy UI]', validationResult);
    return;
  }
  validationResult = null;
}

/** Returns null if API URL is configured, or an error message for the banner. */
export function getApiUrlConfigError(): string | null {
  return validationResult;
}
