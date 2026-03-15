/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_DISABLE_TURNSTILE?: string;
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  readonly VITE_TELEGRAM_BOT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_TELEGRAM_SUPPORT_USERNAME?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  /** Vite: true in dev server, false in production build */
  readonly DEV?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
