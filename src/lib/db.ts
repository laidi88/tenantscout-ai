import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One Prisma client per server process. In development, Next.js reloads
// modules often, so the client is cached on globalThis to avoid opening a new
// connection pool on every reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Railway PostgreSQL connection string to .env (see .env.example).",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}
