# Void Proxy UI

Frontend for the proxy reseller panel (SSPanel). React + Vite + TypeScript + Tailwind.

## Setup

```bash
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL to your API (e.g. https://proxy.void-panel.com/api/v2)
npm install
npm run dev
```

## First run / Первый запуск

**Обязательно для локального dev:**

| Переменная | Описание |
|------------|----------|
| `VITE_API_BASE_URL` | URL API панели (например `http://localhost:3000/api/v2` для dev или `https://proxy.void-panel.com/api/v2` для прода) |

**Опционально:**

| Переменная | Описание |
|------------|----------|
| `VITE_TURNSTILE_SITE_KEY` | Ключ Cloudflare Turnstile для защиты страниц входа/регистрации |
| `VITE_DISABLE_TURNSTILE` | `true` — отключить Turnstile (например на staging) |
| `VITE_TELEGRAM_BOT_USERNAME`, `VITE_TELEGRAM_BOT_ID` | Telegram Login Widget |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Google для входа |
| `VITE_TELEGRAM_SUPPORT_USERNAME`, `VITE_SUPPORT_EMAIL` | Контакты на странице поддержки |

**GitHub Secrets для деплоя** (`.github/workflows/deploy-void-proxy-ui.yml`):

| Secret | Обязательный | Описание |
|--------|--------------|----------|
| `VPS_HOST` | да | Хост VPS |
| `VPS_USERNAME` | да | SSH-пользователь |
| `VPS_SSH_KEY` | да | Приватный SSH-ключ |
| `VPS_PORT` | да | Порт SSH (обычно 22) |
| `VOID_PROXY_UI_API_BASE_URL` | нет | URL API для прода; если не задан, при сборке подставляется `https://proxy.void-panel.com` |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build
- `npm run lint` — typecheck (`tsc --noEmit`)

## Deploy

CI deploys from the main repo via `.github/workflows/deploy-void-proxy-ui.yml` (push to `main` when `modules/void-proxy-ui/**` changes, or manual run). Build runs on VPS; static files are published to `/opt/ss-panel/void-proxy-ui/public`. Point your subdomain (e.g. `proxy.void-panel.com`) at that path in nginx.
