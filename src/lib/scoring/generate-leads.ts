import type { PrismaClient } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { toMatchCompany, toMatchProperty } from "./adapters";
import { isLeadWorthy, scoreAllPairs } from "./matching";

export type GenerateLeadsSummary = {
  pairsScored: number;
  leadsCreated: number;
  leadsRescored: number;
};

/**
 * Scores all companies against all available properties and stores the result.
 * - Existing leads get a fresh score and breakdown; their status, follow-up
 *   date and notes are never changed.
 * - New leads are created only for pairs at or above the score threshold.
 * Not marked server-only so the seed script can call it with its own client.
 */
export async function generateLeads(
  now: Date = new Date(),
  db: PrismaClient = getDb(),
): Promise<GenerateLeadsSummary> {
  const [companies, properties, existing] = await Promise.all([
    db.tenantCompany.findMany({
      include: { signals: { select: { observedAt: true, strength: true } } },
    }),
    db.property.findMany({ where: { status: "AVAILABLE" } }),
    db.lead.findMany({ select: { companyId: true, propertyId: true } }),
  ]);

  const existingKeys = new Set(existing.map((l) => `${l.companyId}:${l.propertyId}`));
  const results = scoreAllPairs(companies.map(toMatchCompany), properties.map(toMatchProperty), now);

  let leadsCreated = 0;
  let leadsRescored = 0;

  await db.$transaction(async (tx) => {
    for (const result of results) {
      const key = `${result.companyId}:${result.propertyId}`;
      const scoreData = {
        score: result.breakdown.total,
        scoreBreakdown: result.breakdown,
        scoredAt: now,
      };
      if (existingKeys.has(key)) {
        await tx.lead.update({
          where: { companyId_propertyId: { companyId: result.companyId, propertyId: result.propertyId } },
          data: scoreData,
        });
        leadsRescored++;
      } else if (isLeadWorthy(result)) {
        await tx.lead.create({
          data: { companyId: result.companyId, propertyId: result.propertyId, ...scoreData },
        });
        leadsCreated++;
      }
    }
  }, { timeout: 60_000 }); // Railway is remote, so allow for network latency on each write.

  return { pairsScored: results.length, leadsCreated, leadsRescored };
}
