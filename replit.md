# EarnOS Campaign Panel

A task-reward/campaign platform simulator with a User Panel (inside a phone device emulator), Admin Control Panel, and Express REST + SSE backend with a JSON file database.

## Run & Operate

- `pnpm --filter @workspace/campaign-panel run dev` — run the frontend (port 18727, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, mounted at `/api`)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4
- API: Express 5 with SSE real-time events
- DB: JSON file at `artifacts/api-server/database.json` (no Postgres needed)
- Firebase: fully stubbed out (`useFirestore=false` — all data via REST API)

## Where things live

- `artifacts/campaign-panel/src/` — React frontend
  - `src/App.tsx` — root component, panel switcher (login/user/admin)
  - `src/components/LoginPage.tsx` — login/signup with math CAPTCHA
  - `src/components/UserPanel.tsx` — full user app (3078 lines)
  - `src/components/AdminPanel.tsx` — admin dashboard (3977 lines)
  - `src/components/DeviceSimulator.tsx` — phone frame wrapper
  - `src/utils/store.ts` — CampaignStore data layer (2193 lines)
  - `src/utils/firebase.ts` — no-op stub (Firebase disabled)
  - `src/utils/data.ts` — seed data (tasks, settings, etc.)
  - `src/types.ts` — all TypeScript types
- `artifacts/api-server/src/routes/` — Express routes
  - `db.ts` — GET/POST /api/db/* + SSE /api/db/events
  - `postback.ts` — ALL /api/postback (offerwall webhook)
  - `upload.ts` — POST /api/upload + GET /api/media-proxy
- `artifacts/api-server/database.json` — runtime JSON database (created on first use)
- `artifacts/api-server/uploads/` — local file uploads fallback

## Architecture decisions

- **Firebase stubbed out**: `useFirestore=false` in store.ts routes all reads/writes through the REST API at `/api/db/*`. The firebase.ts file exports no-op stubs to satisfy TypeScript imports.
- **JSON file as database**: Simpler than Postgres for this use case; full export/import support built in. The database is created on first API call.
- **SSE for real-time sync**: `/api/db/events` streams `database_updated` events to all connected clients after any save/delete operation.
- **Upload pipeline**: Small images (<850KB) returned as base64 data URIs; larger files try Pixeldrain then fall back to local disk.
- **Tailwind brand colors**: `brand-*` colors (oklch scale around hue 255) added to `index.css` `@theme inline` block.

## Product

- **Login page**: Email + password auth with math CAPTCHA. Admin via `admin@gmail.com` / `82503346` or via the Admin Desk tab with PIN `82503346`.
- **User Panel**: Full earning simulator — tasks (timer, screenshot, quiz, auto), daily check-in, scratch card, spin wheel, referral tree, withdrawal, leaderboard, notifications.
- **Admin Panel**: Full control desk — user management, task CRUD, task completion review (approve/reject screenshots), withdrawal processing, postback console, offerwall config, promo codes, data import/export.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The JSON body limit on the API server is set to 315mb to support base64 screenshot uploads.
- Admin panel receives `x-admin-auth: true` header so the server allows status changes (approve/reject) that are blocked for regular users.
- The `dark` CSS class is added to the root `<div>` when `themeMode === 'dark'` so that Tailwind's `dark:` variants work throughout.
- Workflow names: `artifacts/api-server: API Server` and `artifacts/campaign-panel: web`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
