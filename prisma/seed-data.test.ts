import { describe, expect, it } from "vitest";
import { isLeadWorthy, scoreAllPairs } from "../src/lib/scoring/matching";
import { DEMO_COMPANIES, DEMO_LEAD_STATES, DEMO_PROPERTIES, DEMO_SIGNALS } from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe("demo seed data", () => {
  it("uses unique, demo-prefixed IDs", () => {
    for (const [list, prefix] of [
      [DEMO_PROPERTIES, "demo-prop-"],
      [DEMO_COMPANIES, "demo-co-"],
      [DEMO_SIGNALS, "demo-sig-"],
    ] as const) {
      const ids = list.map((x) => x.id);
      expect(unique(ids)).toBe(true);
      for (const id of ids) expect(id.startsWith(prefix)).toBe(true);
    }
    const noteIds = DEMO_LEAD_STATES.flatMap((s) => s.notes.map((n) => n.id));
    expect(unique(noteIds)).toBe(true);
  });

  it("only references records that exist", () => {
    const companyIds = new Set(DEMO_COMPANIES.map((c) => c.id));
    const propertyIds = new Set(DEMO_PROPERTIES.map((p) => p.id));
    for (const s of DEMO_SIGNALS) expect(companyIds.has(s.companyId)).toBe(true);
    for (const l of DEMO_LEAD_STATES) {
      expect(companyIds.has(l.companyId)).toBe(true);
      expect(propertyIds.has(l.propertyId)).toBe(true);
    }
  });

  it("produces a sensible number of leads, with every pipeline example lead-worthy", () => {
    const now = new Date("2026-10-01T00:00:00Z");
    const results = scoreAllPairs(
      DEMO_COMPANIES.map((c) => ({
        ...c,
        targetMoveDate: c.targetMoveInDays == null ? null : new Date(now.getTime() + c.targetMoveInDays * DAY_MS),
        signals: DEMO_SIGNALS.filter((s) => s.companyId === c.id).map((s) => ({
          strength: s.strength,
          observedAt: new Date(now.getTime() - s.daysAgo * DAY_MS),
        })),
      })),
      DEMO_PROPERTIES.filter((p) => !p.status || p.status === "AVAILABLE").map((p) => ({
        ...p,
        availableFrom: p.availableInDays ? new Date(now.getTime() + p.availableInDays * DAY_MS) : null,
      })),
      now,
    );
    const leads = results.filter(isLeadWorthy);
    expect(leads.length).toBeGreaterThan(20);
    expect(leads.length).toBeLessThan(results.length / 3);
    for (const state of DEMO_LEAD_STATES) {
      const pair = results.find((r) => r.companyId === state.companyId && r.propertyId === state.propertyId);
      expect(pair && isLeadWorthy(pair)).toBe(true);
    }
  });
});
