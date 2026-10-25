import { randomUUID } from "node:crypto";
import { Prisma, type Lead, type Note, type Property, type Signal, type TenantCompany } from "@/generated/prisma/client";
import { startOfTodayUtc } from "@/lib/format";
import { toMatchCompany, toMatchProperty } from "@/lib/scoring/adapters";
import { isLeadWorthy, scoreAllPairs } from "@/lib/scoring/matching";
import { scoreMatch, type ScoreBreakdown } from "@/lib/scoring/score";
import { DEMO_COMPANIES, DEMO_LEAD_STATES, DEMO_PROPERTIES, DEMO_SIGNALS } from "../../../prisma/seed-data";

// In-memory copy of the fictional demo data, shaped exactly like the database
// records so pages work unchanged. It lives for as long as the server process:
// changes made in demo mode are lost when the server restarts.

export type DemoStore = {
  properties: Property[];
  companies: TenantCompany[];
  signals: Signal[];
  leads: Lead[];
  notes: Note[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const newId = () => `demo-${randomUUID()}`;
export const decimal = (n: number | null) => (n == null ? null : new Prisma.Decimal(n));

export function companyWithSignals(store: DemoStore, company: TenantCompany) {
  return { ...company, signals: store.signals.filter((s) => s.companyId === company.id) };
}

/** Builds lead data for one pair, mirroring the database version. */
export function scorePair(store: DemoStore, company: TenantCompany, property: Property, now: Date): ScoreBreakdown {
  const c = companyWithSignals(store, company);
  return scoreMatch(toMatchCompany(c), toMatchProperty(property), c.signals, now);
}

/** Same rules as generateLeads(): rescore existing leads, create new ones for strong pairs. */
export function generateDemoLeads(store: DemoStore, now: Date = new Date()) {
  const available = store.properties.filter((p) => p.status === "AVAILABLE");
  const results = scoreAllPairs(
    store.companies.map((c) => toMatchCompany(companyWithSignals(store, c))),
    available.map(toMatchProperty),
    now,
  );
  let leadsCreated = 0;
  let leadsRescored = 0;
  for (const result of results) {
    const existing = store.leads.find((l) => l.companyId === result.companyId && l.propertyId === result.propertyId);
    if (existing) {
      Object.assign(existing, { score: result.breakdown.total, scoreBreakdown: result.breakdown, scoredAt: now, updatedAt: now });
      leadsRescored++;
    } else if (isLeadWorthy(result)) {
      store.leads.push(newLead(result.companyId, result.propertyId, result.breakdown, now));
      leadsCreated++;
    }
  }
  return { pairsScored: results.length, leadsCreated, leadsRescored };
}

export function newLead(companyId: string, propertyId: string, breakdown: ScoreBreakdown, now: Date): Lead {
  return {
    id: newId(),
    companyId,
    propertyId,
    score: breakdown.total,
    scoreBreakdown: breakdown,
    scoredAt: now,
    status: "NEW",
    followUpDate: null,
    ownerName: null,
    createdAt: now,
    updatedAt: now,
    externalId: null,
    externalSource: null,
    lastSyncedAt: null,
  };
}

export function buildDemoStore(now: Date = new Date()): DemoStore {
  const today = startOfTodayUtc(now);
  const inDays = (n: number) => new Date(today.getTime() + n * DAY_MS);
  const stamps = { createdAt: now, updatedAt: now };

  const properties: Property[] = DEMO_PROPERTIES.map(({ availableInDays, status, askingRentEurSqmMonth, ...p }) => ({
    ...p,
    askingRentEurSqmMonth: decimal(askingRentEurSqmMonth),
    availableFrom: availableInDays > 0 ? inDays(availableInDays) : null,
    status: status ?? "AVAILABLE",
    ...stamps,
  }));

  const companies: TenantCompany[] = DEMO_COMPANIES.map(({ targetMoveInDays, maxRentEurSqmMonth, ...c }) => ({
    ...c,
    website: null,
    maxRentEurSqmMonth: decimal(maxRentEurSqmMonth),
    targetMoveDate: targetMoveInDays == null ? null : inDays(targetMoveInDays),
    externalId: null,
    externalSource: null,
    lastSyncedAt: null,
    ...stamps,
  }));

  const signals: Signal[] = DEMO_SIGNALS.map(({ daysAgo, title, summary, sourceName, ...s }) => ({
    ...s,
    title,
    summary,
    sourceName,
    sourceUrl: `https://example.com/demo/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    observedAt: inDays(-daysAgo),
    origin: "MANUAL",
    ...stamps,
  }));

  const store: DemoStore = { properties, companies, signals, leads: [], notes: [] };
  generateDemoLeads(store, now);

  // Give a few leads a realistic pipeline status, follow-up date and notes.
  for (const state of DEMO_LEAD_STATES) {
    const company = companies.find((c) => c.id === state.companyId)!;
    const property = properties.find((p) => p.id === state.propertyId)!;
    let lead = store.leads.find((l) => l.companyId === state.companyId && l.propertyId === state.propertyId);
    if (!lead) {
      lead = newLead(state.companyId, state.propertyId, scorePair(store, company, property, now), now);
      store.leads.push(lead);
    }
    Object.assign(lead, {
      status: state.status,
      followUpDate: state.followUpInDays == null ? null : inDays(state.followUpInDays),
      ownerName: state.ownerName,
    });
    for (const note of state.notes) {
      store.notes.push({
        id: note.id,
        leadId: lead.id,
        body: note.body,
        author: null,
        createdAt: new Date(now.getTime() - note.daysAgo * DAY_MS),
      });
    }
  }
  return store;
}

// Kept on globalThis so the data survives Next.js module reloads in development.
const globalForDemo = globalThis as unknown as { demoStore?: DemoStore };

export function getDemoStore(): DemoStore {
  globalForDemo.demoStore ??= buildDemoStore();
  return globalForDemo.demoStore;
}
