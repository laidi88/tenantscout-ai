import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { PropertyStatus, PropertyType } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/queries";
import { toMatchCompany, toMatchProperty } from "@/lib/scoring/adapters";
import { scoreMatch } from "@/lib/scoring/score";

// Every loader awaits connection() so pages read fresh data per request and
// the production build never needs a database.

export type PropertyFilters = {
  q?: string;
  type?: PropertyType;
  status?: PropertyStatus | "ACTIVE" | "ALL";
};

export async function listProperties(filters: PropertyFilters = {}) {
  await connection();
  if (isDemoMode()) return demo.listProperties(filters);
  const where: Prisma.PropertyWhereInput = {};
  if (filters.q) {
    where.OR = ["name", "addressLine", "city", "submarket"].map((field) => ({
      [field]: { contains: filters.q, mode: "insensitive" },
    }));
  }
  if (filters.type) where.propertyType = filters.type;
  if (!filters.status || filters.status === "ACTIVE") where.status = { not: "ARCHIVED" };
  else if (filters.status !== "ALL") where.status = filters.status;

  return getDb().property.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { _count: { select: { leads: true } } },
  });
}

export async function getProperty(id: string) {
  await connection();
  if (isDemoMode()) return demo.getProperty(id);
  return getDb().property.findUnique({
    where: { id },
    include: {
      leads: { include: { company: { select: { id: true, name: true, industry: true } } }, orderBy: { score: "desc" } },
    },
  });
}

/** Scores every company against this property, best first. */
export async function getMatchingCompanies(propertyId: string, limit = 5) {
  await connection();
  if (isDemoMode()) return demo.getMatchingCompanies(propertyId, limit);
  const db = getDb();
  const [property, companies] = await Promise.all([
    db.property.findUniqueOrThrow({ where: { id: propertyId } }),
    db.tenantCompany.findMany({ include: { signals: { select: { observedAt: true, strength: true } } } }),
  ]);
  const scoringProperty = toMatchProperty(property);
  return companies
    .map((company) => ({
      company: { id: company.id, name: company.name, industry: company.industry },
      breakdown: scoreMatch(toMatchCompany(company), scoringProperty, company.signals),
    }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total)
    .slice(0, limit);
}
