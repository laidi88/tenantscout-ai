# TenantScout AI

A responsive web application for commercial real estate tenant prospecting.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma

## Deployment and database

- The app is deployed to Railway from GitHub.
- The production database is Railway PostgreSQL, accessed through the `DATABASE_URL` environment variable.
- Do not create or depend on a local PostgreSQL database.

## Content

- Use fictional demonstration data only. Never use real companies, people or properties.
- Keep the interface in English.

## Project notes

- Next.js 16 with Cache Components enabled; see @AGENTS.md and read `node_modules/next/dist/docs/` before using Next.js APIs.
- Prisma 7: config in `prisma.config.ts`, client generated to `src/generated/prisma` (not committed), database access via `getDb()` in `src/lib/db.ts`.
- Units: areas in m², rents in €/m²/month.
- Matching scores live in `src/lib/scoring/` (weights in `config.ts`). Keep scoring pure and covered by `npm test`.
- Create migrations with `npm run db:migrate:dev` against the Railway development database; Railway runs `npm run db:deploy` (migrations, then demo seed only into an empty database) before each deploy.
- Anything `next build` or the pre-deploy step needs (Tailwind, TypeScript, type packages, Prisma CLI, tsx, dotenv) is in `dependencies`, not `devDependencies`, so the build works even if the host skips dev dependencies. `next build` uses `tsconfig.build.json`, which excludes tests.
- Data-loading functions live in `src/lib/data/` and call `await connection()` first, so pages render per request and the build never needs a database.
- Demo data is in `prisma/seed-data.ts` (fixed `demo-*` IDs, `example.com` source URLs, invented names and places); `npm run db:seed` loads it.
- Demo mode (`src/lib/demo/`): with no `DATABASE_URL`, every loader in `src/lib/data/` and every Server Action uses an in-memory copy of the seed data instead of Prisma. When adding a query or write, add its demo equivalent in `src/lib/demo/queries.ts` or `mutations.ts`.
- Each data page folder has a `loading.tsx` (re-exporting `src/app/loading.tsx`) so client navigations stay instant under Cache Components.
- Research and CRM extension points are in `src/lib/integrations/` (see `docs/integrations.md`). Only manual signals exist; keep interface wording honest about that.

## Workflow

- Run the production build (`npm run build`) and fix any errors before pushing changes to GitHub.
- Explain significant changes in simple language.
- Do not commit or push changes without asking for approval first.
