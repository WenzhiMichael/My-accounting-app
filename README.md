# Expense Tracker (Next.js)

Multi-account tracker with mobile-friendly UI, app lock, theming, dashboards, and recurring-aware transactions.

Live site: https://my-accountingapp.vercel.app/

## Core features

- Dashboard: monthly income/expense/balance, category pie, per-account spend, recent transactions.
- Transactions: filters by time (overall/7d/30d/6mo) and account, detailed edit, recurring metadata, note suggestions, custom keypad.
- Accounts: add/edit/delete with colors and credit metadata.
- Settings: light/dark/system theme, App Lock (biometric/passcode toggle).

## Run locally

```bash
npm install
npm run dev
# or to allow phone access on the same Wi‑Fi:
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Then open [http://localhost:3000](http://localhost:3000) on your machine.

### Access from your phone (same Wi‑Fi)

1) Find your computer’s LAN IP (e.g. `192.168.1.23`).  
2) Start the dev server with `--hostname 0.0.0.0` (see above).  
3) On your phone’s browser, visit `http://<LAN_IP>:3000` (e.g. `http://192.168.1.23:3000`).  
The app is responsive and works on mobile.

## Paths to explore

- Dashboard: `app/page.tsx`
- Transactions: `app/expenses/page.tsx`, `app/expenses/[id]/page.tsx`, `app/expenses/all/page.tsx`, `app/income/page.tsx`
- Add/Edit transaction: `app/expenses/new/page.tsx`
- Accounts: `app/accounts/page.tsx`, `app/accounts/[id]/page.tsx`
- Settings & theming/app lock: `app/settings/page.tsx`, `components/layout/app-shell.tsx`, `app/globals.css`
