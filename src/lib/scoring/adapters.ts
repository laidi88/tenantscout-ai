import type { Property, Signal, TenantCompany } from "@/generated/prisma/client";
import type { MatchCompany, MatchProperty } from "./matching";

// Converts database records into the plain inputs the scoring engine expects.

export function toMatchProperty(p: Property): MatchProperty {
  return { ...p, askingRentEurSqmMonth: p.askingRentEurSqmMonth?.toNumber() ?? null };
}

export function toMatchCompany(
  c: TenantCompany & { signals: Pick<Signal, "observedAt" | "strength">[] },
): MatchCompany {
  return { ...c, maxRentEurSqmMonth: c.maxRentEurSqmMonth?.toNumber() ?? null };
}
