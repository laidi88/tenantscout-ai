import { LEAD_REQUIRED_CRITERIA, LEAD_SCORE_THRESHOLD } from "./config";
import {
  scoreMatch,
  type ScoreBreakdown,
  type ScoringCompany,
  type ScoringProperty,
  type ScoringSignal,
} from "./score";

export type MatchCompany = ScoringCompany & { id: string; signals: ScoringSignal[] };
export type MatchProperty = ScoringProperty & { id: string };

export type MatchResult = {
  companyId: string;
  propertyId: string;
  breakdown: ScoreBreakdown;
};

/**
 * Scores every company against every property and returns all pairs,
 * best first. Use `isLeadWorthy` to decide which pairs become new leads.
 */
export function scoreAllPairs(
  companies: MatchCompany[],
  properties: MatchProperty[],
  now: Date = new Date(),
): MatchResult[] {
  const results: MatchResult[] = [];
  for (const company of companies) {
    for (const property of properties) {
      results.push({
        companyId: company.id,
        propertyId: property.id,
        breakdown: scoreMatch(company, property, company.signals, now),
      });
    }
  }
  return results.sort((a, b) => b.breakdown.total - a.breakdown.total);
}

export function isLeadWorthy(result: MatchResult): boolean {
  const { total, criteria } = result.breakdown;
  const passesRequired = LEAD_REQUIRED_CRITERIA.every(
    (key) => (criteria.find((c) => c.key === key)?.points ?? 0) > 0,
  );
  return total >= LEAD_SCORE_THRESHOLD && passesRequired;
}
