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
- Create migrations with `npm run db:migrate:dev` against the Railway development database; Railway runs `npm run db:migrate` before each deploy.

## Workflow

- Run the production build (`npm run build`) and fix any errors before pushing changes to GitHub.
- Explain significant changes in simple language.
- Do not commit or push changes without asking for approval first.
