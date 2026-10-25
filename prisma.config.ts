import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL points at Railway PostgreSQL (a dev database locally, the
// production database on Railway). It is optional here so that
// `prisma generate` and `next build` work without a database connection.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
