# ميزان — miZan

> تحكّم ففلوسك، وشوف لقدّام — Personal 12-month cashflow forecasting in Moroccan Darija (`ar-MA`, RTL).

Live app: **https://mizan.wliddev.com**

## Core Principles

- **100% Local-First Privacy:** Every balance, salary, bill, goal, and debt stays strictly on your device in `localStorage`. Zero backend, zero accounts, zero analytics, zero third-party network calls (enforced by CSP `connect-src 'self'`).
- **Installable Offline PWA:** Installs cleanly on Android Chrome, iOS Safari, and Desktop Chrome with Workbox precaching and prompt-to-reload updates (`registerType: 'prompt'`).
- **Pure 12-Month Forecast Engine:** Deterministic cashflow projection with 4/8/12-month milestones, invariant monthly slices for goals/shocks/debts, Month-0 settlement for overdue unpaid balances, and isolated scenario simulation.
- **Resilient JSON Backup & Restore:** Schema-versioned (`v2`) backups with strict runtime validation, automatic `v1 → v2` migration, corrupt-storage quarantine (`mizan-data.recovered.<ts>`), and pre-import undo snapshots.

## Backup & Restore

1. Open the **البيانات** tab (`#/data`).
2. Tap **نزّل النسخة** (or **بارطاجي النسخة** on mobile) to save a timestamped `mizan-backup-YYYY-MM-DD.json` file.
3. To restore on any device, tap **اختار ملف**, review the confirmation preview, and confirm. An undo toast restores your previous data if needed.

## Development

Requires **Node.js ≥ 22**.

```bash
npm install
npm run dev                  # Start Vite dev server
npm test                     # Run Vitest unit & schema suites
npm run lint                 # Run Oxlint
npm run build                # Typecheck (tsc -b) + production PWA build
npm run preview              # Preview production build locally
npm run generate-pwa-assets  # Regenerate PWA icons from public/logo.svg
npm run test:e2e             # Run Playwright viewport, axe, offline & installability specs
npm run lhci                 # Run Lighthouse CI mobile audit against dist/
```

## Deployment (Vercel)

- Production domain: `mizan.wliddev.com` (`CNAME mizan -> cname.vercel-dns.com`).
- `vercel.json` configures immutable `/assets/*` caching, `no-cache` for `/sw.js`, `/manifest.webmanifest`, and `/index.html`, and strict security headers (`CSP`, `HSTS`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `COOP`).
