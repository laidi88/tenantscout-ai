import { beforeEach, describe, expect, it } from "vitest";
import { isDemoMode } from "./mode";
import * as mutations from "./mutations";
import * as queries from "./queries";
import { buildDemoStore, getDemoStore } from "./store";

// Each test starts from a fresh copy of the demo data.
beforeEach(() => {
  (globalThis as { demoStore?: unknown }).demoStore = buildDemoStore();
});

describe("isDemoMode", () => {
  it("is on only when DATABASE_URL is missing", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(isDemoMode()).toBe(true);
    process.env.DATABASE_URL = "postgresql://example";
    expect(isDemoMode()).toBe(false);
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });
});

describe("demo store", () => {
  it("loads the fictional data with leads, pipeline states and notes", () => {
    const store = getDemoStore();
    expect(store.properties).toHaveLength(15);
    expect(store.companies).toHaveLength(20);
    expect(store.signals).toHaveLength(28);
    expect(store.leads.length).toBeGreaterThan(20);
    expect(store.notes.length).toBeGreaterThan(0);
    expect(store.leads.some((l) => l.status === "NEGOTIATION")).toBe(true);
    for (const s of store.signals) expect(s.sourceUrl).toMatch(/^https:\/\/example\.com\/demo\//);
  });
});

describe("demo queries", () => {
  it("builds the dashboard", () => {
    const d = queries.getDashboard();
    expect(d.totals.availableProperties).toBe(14);
    expect(d.totals.companies).toBe(20);
    expect(d.topLeads.length).toBe(8);
    expect(d.topLeads[0].score).toBeGreaterThanOrEqual(d.topLeads[7].score);
    expect(d.totals.overdueCount).toBe(2);
    expect(d.recentSignals).toHaveLength(5);
  });

  it("filters properties like the database version", () => {
    expect(queries.listProperties({ type: "LOGISTICS" }).every((p) => p.propertyType === "LOGISTICS")).toBe(true);
    expect(queries.listProperties({ q: "harbour" }).map((p) => p.name)).toContain("Harbour Point");
    expect(queries.listProperties({ status: "UNDER_OFFER" })).toHaveLength(1);
  });

  it("filters leads by status, score and follow-up", () => {
    expect(queries.listLeads({}).every((l) => l.status !== "WON" && l.status !== "LOST")).toBe(true);
    expect(queries.listLeads({ status: "LOST" })).toHaveLength(1);
    expect(queries.listLeads({ minScore: 75 }).every((l) => l.score >= 75)).toBe(true);
    expect(queries.listLeads({ followUp: "overdue" })).toHaveLength(2);
  });

  it("returns a lead with its breakdown, company signals and notes", () => {
    const lead = queries.listLeads({ status: "VIEWING" })[0];
    const full = queries.getLead(lead.id)!;
    expect(full.breakdown.criteria).toHaveLength(6);
    expect(full.notes.length).toBe(2);
    expect(full.company.signals.length).toBeGreaterThan(0);
  });
});

describe("demo mutations", () => {
  it("adds a property and turns a strong pair into a lead", () => {
    const property = mutations.createProperty({
      name: "Test Quay House",
      addressLine: "1 Test Street",
      city: "Lindenfeld",
      submarket: "Old Town",
      propertyType: "OFFICE",
      totalAreaSqm: 600,
      minDivisibleAreaSqm: null,
      askingRentEurSqmMonth: 27,
      availableFrom: null,
      features: [],
      description: null,
      status: "AVAILABLE",
    });
    const summary = mutations.generateLeads();
    expect(summary.leadsCreated).toBeGreaterThan(0);
    expect(queries.getProperty(property.id)!.leads.length).toBeGreaterThan(0);
  });

  it("keeps a lead's status when matches are regenerated", () => {
    const lead = queries.listLeads({ status: "NEGOTIATION" })[0];
    mutations.generateLeads();
    expect(queries.getLead(lead.id)!.status).toBe("NEGOTIATION");
  });

  it("deletes a company with its signals, leads and notes", () => {
    const lead = queries.listLeads({ status: "VIEWING" })[0];
    mutations.deleteCompany(lead.companyId);
    const store = getDemoStore();
    expect(store.signals.some((s) => s.companyId === lead.companyId)).toBe(false);
    expect(store.leads.some((l) => l.companyId === lead.companyId)).toBe(false);
    expect(store.notes.some((n) => n.leadId === lead.id)).toBe(false);
  });

  it("updates a lead and manages notes", () => {
    const lead = queries.listLeads({})[0];
    mutations.updateLead(lead.id, { status: "QUALIFIED", followUpDate: null, ownerName: "Test Owner" });
    mutations.addNote(lead.id, "Called the tenant.");
    const full = queries.getLead(lead.id)!;
    expect(full.status).toBe("QUALIFIED");
    expect(full.notes[0].body).toBe("Called the tenant.");
    mutations.deleteNote(full.notes[0].id);
    expect(queries.getLead(lead.id)!.notes.some((n) => n.body === "Called the tenant.")).toBe(false);
  });
});
