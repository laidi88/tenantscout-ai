# TenantScout AI

Tenant prospecting for commercial real estate leasing. Record vacant properties and potential tenant companies, log publicly reported expansion or relocation signals with their source links, and match companies to properties with transparent, explainable scores.

> **Demo project.** All companies, properties, places, people and news items are fictional. Signals are entered by hand; there is no automated web monitoring and no CRM connection yet (see [docs/integrations.md](docs/integrations.md)).

## Features

- **Properties:** vacant and upcoming spaces with area (m²), divisible units, asking rent (€/m²/month), availability and status.
- **Companies:** business profiles and space requirements: size range, preferred cities, submarkets and property types, rent budget and target move date.
- **Signals:** expansion, relocation, hiring, funding and lease-expiry news, each with a required source URL.
- **Matching:** every company/property pair gets a score out of 100 across six criteria, each with a plain-English reason.
- **Leads:** status pipeline, follow-up dates, owner and notes.
- **Dashboard:** top opportunities, follow-ups due, pipeline counts and recent signals.

## How scoring works

| Criterion | Points | Full points when… |
|---|---|---|
| Size fit | 25 | The property's lettable range overlaps the space needed |
| Location fit | 20 | The property is in a preferred submarket (or a preferred city, if no submarkets are set) |
| Property type fit | 15 | The type is a preferred type (related types get partial points) |
| Budget fit | 15 | Asking rent is within the maximum rent |
| Timing fit | 10 | Available on or before the target move date |
| Signal strength | 15 | A strong signal in the last 90 days (older signals count for less) |

Missing preferences earn half points. **Generate matches** creates a lead when a pair scores 40 or more **and** scores above zero on size, location and property type. Re-running it updates scores but never changes a lead's status, follow-up date or notes. All rules are in [`src/lib/scoring/config.ts`](src/lib/scoring/config.ts).

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Prisma 7 and PostgreSQL on Railway. There is no local database: development uses a separate Railway database.

## Quick start: demo mode (no database)

If `DATABASE_URL` is not set, the app runs in **Demo Mode**. It serves the fictional demo data from memory, and a "Demo Mode" banner appears on every page.

1. `npm install`
2. Make sure there is no `.env` file, or that it has no `DATABASE_URL`.
3. `npm run dev` and open http://localhost:3000.

Everything works in demo mode, including adding and editing records, generating matches, changing lead status and adding notes. Changes are kept in memory only and reset when the server restarts. Setting `DATABASE_URL` switches back to PostgreSQL with no code changes.

## Local setup with a database

1. `npm install`
2. In Railway, create a **development** PostgreSQL database, separate from production. Copy its public connection URL.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to that URL.
4. `npm run db:migrate` to create the tables.
5. `npm run db:seed` to load the fictional demo data.
6. `npm run dev` and open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build for production (no database needed) |
| `npm test` | Run the unit tests (scoring, validation, demo data) |
| `npm run lint` / `npm run typecheck` | Check code style and types |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` |
| `npm run db:migrate:dev` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:seed` | Load or refresh the demo data (safe to re-run; your own records are not touched) |
| `npm run db:deploy` | What Railway runs before each release: migrations, then demo data only if the database is empty |

## Deploying to Railway

1. Push this repository to GitHub.
2. In Railway, create a project and add a **PostgreSQL** service.
3. Add a service from the GitHub repository. If you deploy from a branch other than `main`, choose it under **Settings → Source**.
4. In the app service's **Variables**, add `DATABASE_URL` with the value `${{Postgres.DATABASE_URL}}`. This uses Railway's private network. Without it the app falls back to Demo Mode, and the pre-deploy step fails on purpose so this can't happen silently.
5. Under **Settings → Networking**, generate a public domain.
6. Deploy. [`railway.json`](railway.json) handles the rest:
   - **Build:** `npm run build`. This generates the Prisma client and builds Next.js, with no database needed.
   - **Pre-deploy:** `npm run db:deploy`. This applies database migrations, then loads the fictional demo data, but **only if the database is empty**, so later deploys never overwrite your data. Set `SEED_DEMO_DATA=false` to start with an empty database instead.
   - **Start:** `next start` on Railway's `PORT`.
   - **Health check:** `/api/health`. It doesn't depend on the database.
7. Open the public domain. You should see the dashboard with data and **no** "Demo Mode" banner.

Every push to the connected branch redeploys automatically.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `${{Postgres.DATABASE_URL}}` |
| `SEED_DEMO_DATA` | No | Set to `false` to skip loading demo data into an empty database |

Railway sets `PORT` and `NODE_ENV` automatically. Railway's builder picks the Node.js version from `engines.node` in `package.json` (Node 22 LTS or newer).

### Troubleshooting

- **Pre-deploy fails with `P1001: Can't reach database server`:** check that `DATABASE_URL` references the Postgres service (`${{Postgres.DATABASE_URL}}`) and that both services are in the same project and environment.
- **Pre-deploy fails with `datasource.url property is required`:** `DATABASE_URL` isn't set on the app service.
- **The site shows the "Demo Mode" banner:** the running service has no `DATABASE_URL`. Add it and redeploy.
