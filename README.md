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

## Local setup

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

## Deploying to Railway

1. Push this repository to GitHub.
2. In Railway, create a project and add a **PostgreSQL** service.
3. Add a service from the GitHub repository.
4. In the app service's **Variables**, add `DATABASE_URL` with the value `${{Postgres.DATABASE_URL}}`. This uses Railway's private network.
5. Under **Settings → Networking**, generate a public domain.
6. Deploy. [`railway.json`](railway.json) runs `npm run build`, applies migrations with `npm run db:migrate` before each release, starts the app with `next start`, and checks `/api/health`.
7. Load the demo data once. On your computer, temporarily set `DATABASE_URL` in `.env` to the production database's **public** URL (Postgres service → Connect → Public Network), run `npm run db:seed`, then switch `.env` back to the development database.

Every push to the connected branch redeploys automatically.
