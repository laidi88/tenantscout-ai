# TenantScout AI

Tenant prospecting for commercial real estate leasing: record vacant properties and tenant companies, log publicly available expansion or relocation signals, and match companies to properties with transparent, explainable scores.

All data in this project is fictional demonstration data. Signals are entered by hand with a source URL; there is no automated web monitoring.

## Tech stack

Next.js (App Router), TypeScript, Tailwind CSS, Prisma 7 and Railway PostgreSQL.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a Railway **development** PostgreSQL database.
3. `npm run db:migrate` to create the tables.
4. `npm run dev`

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm test` | Run the unit tests |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` |
| `npm run db:migrate:dev` | Create a new migration after changing `prisma/schema.prisma` |

## Deploying to Railway

Connect the GitHub repository to a Railway service and add a PostgreSQL service. Set the app's `DATABASE_URL` variable to `${{Postgres.DATABASE_URL}}`. `railway.json` builds the app, applies migrations before each deploy, and starts it with `next start`.
