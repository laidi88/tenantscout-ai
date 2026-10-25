import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { toMatchCompany, toMatchProperty } from "@/lib/scoring/adapters";
import { scoreMatch } from "@/lib/scoring/score";

export async function listCompanies(filters: { q?: string } = {}) {
  await connection();
  const where: Prisma.TenantCompanyWhereInput = filters.q
    ? {
        OR: ["name", "industry", "currentCity"].map((field) => ({
          [field]: { contains: filters.q, mode: "insensitive" },
        })),
      }
    : {};

  const companies = await getDb().tenantCompany.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { signals: true, leads: true } },
      signals: { orderBy: { observedAt: "desc" }, take: 1, select: { observedAt: true, type: true } },
      leads: { orderBy: { score: "desc" }, take: 1, select: { score: true } },
    },
  });
  return companies.map(({ signals, leads, ...c }) => ({
    ...c,
    latestSignal: signals[0] ?? null,
    bestScore: leads[0]?.score ?? null,
  }));
}

export async function getCompany(id: string) {
  await connection();
  return getDb().tenantCompany.findUnique({
    where: { id },
    include: {
      signals: { orderBy: { observedAt: "desc" } },
      leads: {
        include: { property: { select: { id: true, name: true, city: true, submarket: true } } },
        orderBy: { score: "desc" },
      },
    },
  });
}

/** Scores this company against every available property, best first. */
export async function getMatchingProperties(companyId: string, limit = 5) {
  await connection();
  const db = getDb();
  const [company, properties] = await Promise.all([
    db.tenantCompany.findUniqueOrThrow({
      where: { id: companyId },
      include: { signals: { select: { observedAt: true, strength: true } } },
    }),
    db.property.findMany({ where: { status: "AVAILABLE" } }),
  ]);
  const scoringCompany = toMatchCompany(company);
  return properties
    .map((property) => ({
      property: { id: property.id, name: property.name, city: property.city, submarket: property.submarket },
      breakdown: scoreMatch(scoringCompany, toMatchProperty(property), company.signals),
    }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total)
    .slice(0, limit);
}
