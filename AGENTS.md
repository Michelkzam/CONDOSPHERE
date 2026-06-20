# AGENTS.md — CondoSphere

## What this is

CondoSphere is a condominium management ERP with two operating modes:
1. **Offline prototype** — `index.html` (12,800-line monolith, open directly in browser, zero dependencies)
2. **Server + React SPA** — `server.js` (Node.js REST API + static server) + `src/App.tsx` (React/TypeScript frontend)

Both share the same data layer. The React app in `src/` has **no build pipeline** (no tsconfig, no bundler config, no Vite/Webpack). Treat `src/` components as source-of-truth for feature logic, but they are not compiled independently.

## Running the project

```bash
npm install              # install deps (pg, sqlite3, @supabase/ssr)
node server.js           # starts on http://localhost:3000
# OR on Windows:
iniciar_sistema.bat      # detects config, starts server + opens browser
```

There are **no** `npm run dev`, `npm run build`, `npm test`, `npm run lint`, or `npm run typecheck` scripts. The only npm scripts are `start` and `install-deps`.

## Database — three-tier fallback

`server.js` auto-detects which DB to use from `data/db_config.json`:

1. **PostgreSQL** — `db_type: "postgres"` (uses `pg` pool, schema: `supabase_schema.sql`)
2. **SQLite** — `db_type: "sqlite"` (uses `sqlite3` native, schema: `sqlite_schema.sql`, DB file: `data/condosphere.db`)
3. **JSON file** — ultimate fallback (`data/db.json`, written sequentially via `safeUpdateJsonDB`)

Current config (`data/db_config.json`): SQLite mode. The server auto-applies the corresponding SQL schema on startup.

### REST API

All endpoints at `/api/:table[/:id]`:
- `GET /api/:table` — list all rows
- `POST /api/:table` — insert (accepts single object or array)
- `PUT /api/:table` — upsert (conflict columns: `identifier` for residences, `cpf` for residents, `plate` for vehicles, `id` for others)
- `DELETE /api/:table/:id` — delete by id
- `POST /api/reset` — truncate all tables and re-seed

## Supabase integration

- **Browser client**: `src/lib/supabaseClient.ts` → `utils/supabase/client.ts` (uses `@supabase/ssr` `createBrowserClient`)
- **Server/middleware helpers**: `utils/supabase/server.ts`, `utils/supabase/middleware.ts` (Next.js-style, not currently wired to the server)
- **Edge functions**: `supabase/functions/todos/` (minimal, placeholder)
- **Schema**: `supabase_schema.sql` — run in Supabase SQL Editor to set up the cloud DB

Required env vars (in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Authentication

Login is two-tier (see `src/components/Login.tsx`):
1. **Hardcoded presets** (offline, always available):
   - `admin.geral` / `12345678901` (Administrador)
   - `reginaldo.silveira` / `22233344455` (Colaborador)
   - `carlos.silva` / `33344455566` (Morador)
   - `jose.portaria` / `44455566677` (Portaria)
2. **Supabase `users` table** — queried if presets don't match

Password is always the user's CPF (digits only). RBAC roles: Administrador, Colaborador, Morador, Portaria.

## Architecture gotchas

- **Language is Brazilian Portuguese** — UI, log messages, SQL comments, bat scripts. Do not translate.
- **No build step for React** — `src/App.tsx` and `src/components/*.tsx` use TSX syntax but there's no TypeScript compiler or bundler configured. Edits to these files won't auto-compile.
- **SheetJS inlined** — `xlsx.full.min.js` (880KB) is included as a static file, loaded by `index.html`. Do not remove or update without testing import/export flows.
- **SafeStorage** — The offline prototype wraps `localStorage` calls to handle iframe sandbox exceptions. If adding new storage, use the same pattern.
- **JSON write queue** — `server.js` queues JSON-fallback writes sequentially to prevent race conditions during bulk imports. Do not bypass this.
- **Windows-only installer** — `instalar_condosphere.bat` handles Node.js, SQLite binary download, and DB creation. `iniciar_sistema.bat` is the launcher. `desinstalar_condosphere.bat` is the uninstaller.
- **Vercel deployment** — `vercel.json` serves static files only (no serverless functions). `server.js` is not deployed to Vercel.
- **No tests** — There is no test framework or test files in this repo.
- **No linting/formatting** — No ESLint, Prettier, or other config.

## Key files

| File | Purpose |
|------|---------|
| `index.html` | Standalone offline prototype (monolith) |
| `server.js` | Node.js REST API + static server (port 3000) |
| `src/App.tsx` | React SPA entry point |
| `src/components/` | 30 React components (feature modules) |
| `src/lib/supabaseClient.ts` | Supabase browser client + DB type definitions |
| `utils/supabase/` | SSR/middleware helpers for Supabase |
| `supabase_schema.sql` | PostgreSQL DDL (for Supabase cloud) |
| `sqlite_schema.sql` | SQLite DDL (for local server) |
| `data/db_config.json` | Active DB config (currently: SQLite) |
| `data/db.json` | JSON fallback database (created at runtime) |
| `data/condosphere.db` | SQLite database file |
| `instalar_condosphere.bat` | Windows installer (Node.js + SQLite + DB setup) |
| `iniciar_sistema.bat` | Windows launcher (detects mode, starts server) |
