# Void Proxy UI

Frontend for the proxy reseller panel (SSPanel). React + Vite + TypeScript + Tailwind.

## Setup

```bash
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL to your API (e.g. https://proxy.void-panel.com/api/v2)
npm install
npm run dev
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build
- `npm run lint` — typecheck (`tsc --noEmit`)

## Deploy

CI deploys from the main repo via `.github/workflows/deploy-void-proxy-ui.yml` (push to `main` when `modules/void-proxy-ui/**` changes, or manual run). Build runs on VPS; static files are published to `/opt/ss-panel/void-proxy-ui/public`. Point your subdomain (e.g. `proxy.void-panel.com`) at that path in nginx.
