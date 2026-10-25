import { describe, expect, it } from "vitest";
import { LEAD_SCORE_THRESHOLD, SCORING_WEIGHTS } from "./config";
import { isLeadWorthy, scoreAllPairs } from "./matching";
import { formatType, scoreBand, scoreMatch, type ScoringCompany, type ScoringProperty } from "./score";

const NOW = new Date("2026-10-01T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

const company: ScoringCompany = {
  requiredAreaMinSqm: 800,
  requiredAreaMaxSqm: 1200,
  preferredCities: ["Lindenfeld"],
  preferredSubmarkets: ["Harbour District"],
  preferredPropertyTypes: ["OFFICE"],
  maxRentEurSqmMonth: 25,
  targetMoveDate: new Date("2027-03-01T00:00:00Z"),
};

const property: ScoringProperty = {
  city: "Lindenfeld",
  submarket: "Harbour District",
  propertyType: "OFFICE",
  totalAreaSqm: 1500,
  minDivisibleAreaSqm: 700,
  askingRentEurSqmMonth: 22.5,
  availableFrom: new Date("2027-01-01T00:00:00Z"),
};

const pointsFor = (key: string, result: ReturnType<typeof scoreMatch>) =>
  result.criteria.find((c) => c.key === key)!.points;

describe("scoreMatch", () => {
  it("awards full points for a perfect match with a fresh strong signal", () => {
    const result = scoreMatch(company, property, [{ observedAt: daysAgo(10), strength: "HIGH" }], NOW);
    expect(result.total).toBe(100);
    expect(result.band).toBe("Strong");
    expect(result.criteria).toHaveLength(6);
  });

  it("weights add up to 100", () => {
    expect(Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("total always equals the sum of criterion points", () => {
    const result = scoreMatch(company, { ...property, totalAreaSqm: 600, minDivisibleAreaSqm: null }, [], NOW);
    expect(result.total).toBe(result.criteria.reduce((s, c) => s + c.points, 0));
  });

  it("gives every criterion a reason", () => {
    const result = scoreMatch(company, property, [], NOW);
    for (const c of result.criteria) expect(c.reason.length).toBeGreaterThan(10);
  });

  describe("size", () => {
    it("reduces points when the property is too small", () => {
      // 600 m² vs 800 m² minimum = 25% short; zero at 50% → half of 25 points.
      const result = scoreMatch(company, { ...property, totalAreaSqm: 600, minDivisibleAreaSqm: null }, [], NOW);
      expect(pointsFor("size", result)).toBe(13);
      expect(result.criteria[0].reason).toContain("25% too small");
    });

    it("reduces points when the smallest unit is too large", () => {
      const result = scoreMatch(company, { ...property, totalAreaSqm: 3000, minDivisibleAreaSqm: 1800 }, [], NOW);
      expect(pointsFor("size", result)).toBe(0);
      expect(result.criteria[0].reason).toContain("too large");
    });

    it("gives half points when no requirement is recorded", () => {
      const result = scoreMatch({ ...company, requiredAreaMinSqm: null, requiredAreaMaxSqm: null }, property, [], NOW);
      expect(pointsFor("size", result)).toBe(13);
    });
  });

  describe("location", () => {
    it("gives partial points for the right city but another submarket", () => {
      const result = scoreMatch(company, { ...property, submarket: "Old Town" }, [], NOW);
      expect(pointsFor("location", result)).toBe(12);
    });

    it("gives zero outside preferred locations", () => {
      const result = scoreMatch(company, { ...property, city: "Elmbrook", submarket: null }, [], NOW);
      expect(pointsFor("location", result)).toBe(0);
    });

    it("matches case-insensitively", () => {
      const result = scoreMatch(company, { ...property, submarket: "harbour district" }, [], NOW);
      expect(pointsFor("location", result)).toBe(20);
    });
  });

  describe("property type", () => {
    it("gives half points for a related type", () => {
      const result = scoreMatch(company, { ...property, propertyType: "MIXED_USE" }, [], NOW);
      expect(pointsFor("propertyType", result)).toBe(8);
    });

    it("gives zero for an unrelated type", () => {
      const result = scoreMatch(company, { ...property, propertyType: "LOGISTICS" }, [], NOW);
      expect(pointsFor("propertyType", result)).toBe(0);
    });
  });

  describe("budget", () => {
    it("reduces points when rent is above budget", () => {
      // €27.50 vs €25 = 10% over; zero at 25% → 60% of 15 points.
      const result = scoreMatch(company, { ...property, askingRentEurSqmMonth: 27.5 }, [], NOW);
      expect(pointsFor("budget", result)).toBe(9);
      expect(result.criteria[3].reason).toContain("10% above");
    });

    it("gives half points when the asking rent is unknown", () => {
      const result = scoreMatch(company, { ...property, askingRentEurSqmMonth: null }, [], NOW);
      expect(pointsFor("budget", result)).toBe(8);
    });
  });

  describe("timing", () => {
    it("reduces points when the space is available after the target date", () => {
      // 90 days late; zero at 180 days → half of 10 points.
      const result = scoreMatch(company, { ...property, availableFrom: new Date("2027-05-30T00:00:00Z") }, [], NOW);
      expect(pointsFor("timing", result)).toBe(5);
    });

    it("treats a missing availability date as available now", () => {
      const result = scoreMatch(company, { ...property, availableFrom: null }, [], NOW);
      expect(pointsFor("timing", result)).toBe(10);
      expect(result.criteria[4].reason).toContain("Available now");
    });
  });

  describe("signals", () => {
    it("gives zero with no signals", () => {
      expect(pointsFor("signals", scoreMatch(company, property, [], NOW))).toBe(0);
    });

    it("discounts older signals", () => {
      const fresh = scoreMatch(company, property, [{ observedAt: daysAgo(30), strength: "HIGH" }], NOW);
      const older = scoreMatch(company, property, [{ observedAt: daysAgo(150), strength: "HIGH" }], NOW);
      const stale = scoreMatch(company, property, [{ observedAt: daysAgo(400), strength: "HIGH" }], NOW);
      expect(pointsFor("signals", fresh)).toBe(15);
      expect(pointsFor("signals", older)).toBe(9);
      expect(pointsFor("signals", stale)).toBe(0);
    });

    it("adds a bonus for additional recent signals, capped at full points", () => {
      const one = scoreMatch(company, property, [{ observedAt: daysAgo(30), strength: "MEDIUM" }], NOW);
      const two = scoreMatch(
        company,
        property,
        [
          { observedAt: daysAgo(30), strength: "MEDIUM" },
          { observedAt: daysAgo(60), strength: "LOW" },
        ],
        NOW,
      );
      expect(pointsFor("signals", one)).toBe(9);
      expect(pointsFor("signals", two)).toBe(11);
    });
  });
});

describe("scoreAllPairs", () => {
  it("scores every pair and sorts best first", () => {
    const results = scoreAllPairs(
      [{ ...company, id: "c1", signals: [] }],
      [
        { ...property, id: "weak", city: "Elmbrook", submarket: null, propertyType: "LOGISTICS" },
        { ...property, id: "strong" },
      ],
      NOW,
    );
    expect(results.map((r) => r.propertyId)).toEqual(["strong", "weak"]);
    expect(isLeadWorthy(results[0])).toBe(true);
  });

  it("never makes a lead from a wrong location or type, even with a high total", () => {
    const [wrongCity] = scoreAllPairs(
      [{ ...company, id: "c1", signals: [{ observedAt: daysAgo(10), strength: "HIGH" }] }],
      [{ ...property, id: "p1", city: "Elmbrook", submarket: null }],
      NOW,
    );
    expect(wrongCity.breakdown.total).toBeGreaterThanOrEqual(LEAD_SCORE_THRESHOLD);
    expect(isLeadWorthy(wrongCity)).toBe(false);

    const [wrongType] = scoreAllPairs(
      [{ ...company, id: "c1", signals: [] }],
      [{ ...property, id: "p1", propertyType: "LOGISTICS" }],
      NOW,
    );
    expect(isLeadWorthy(wrongType)).toBe(false);
  });

  it("does not make a lead below the score threshold", () => {
    const [low] = scoreAllPairs(
      [{ ...company, id: "c1", signals: [] }],
      [
        {
          ...property,
          id: "p1",
          submarket: "Old Town",
          propertyType: "MIXED_USE",
          totalAreaSqm: 500,
          minDivisibleAreaSqm: null,
          askingRentEurSqmMonth: 32,
          availableFrom: new Date("2027-12-01T00:00:00Z"),
        },
      ],
      NOW,
    );
    expect(low.breakdown.total).toBeLessThan(LEAD_SCORE_THRESHOLD);
    expect(isLeadWorthy(low)).toBe(false);
  });
});

describe("helpers", () => {
  it("maps totals to bands", () => {
    expect(scoreBand(80)).toBe("Strong");
    expect(scoreBand(60)).toBe("Good");
    expect(scoreBand(40)).toBe("Moderate");
    expect(scoreBand(10)).toBe("Weak");
  });

  it("formats property types", () => {
    expect(formatType("MIXED_USE")).toBe("Mixed-Use");
    expect(formatType("OFFICE")).toBe("Office");
  });
});
