import type { Lead, Property, TenantCompany } from "@/generated/prisma/client";
import { PropertyStatus } from "@/generated/prisma/enums";
import type { LeadFilters } from "@/lib/data/leads";
import type { PropertyFilters } from "@/lib/data/properties";
import { startOfTodayUtc } from "@/lib/format";
import { CLOSED_LEAD_STATUSES } from "@/lib/labels";
import type { ScoreBreakdown } from "@/lib/scoring/score";
import type { SignalStrength, SignalType } from "@/generated/prisma/enums";
import { getDemoStore, scorePair, type DemoStore } from "./store";

// In-memory equivalents of the queries in src/lib/data/. Each returns the same
// shape as its database version, with the same filters and sort order.

const DAY_MS = 24 * 60 * 60 * 1000;
const contains = (value: string | null | undefined, q: string) => value?.toLowerCase().includes(q.toLowerCase()) ?? false;
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
const isOpen = (l: Lead) => !CLOSED_LEAD_STATUSES.includes(l.status);

function companySummary(store: DemoStore, id: string) {
  const c = store.companies.find((x) => x.id === id)!;
  return { id: c.id, name: c.name, industry: c.industry };
}

function propertySummary(store: DemoStore, id: string) {
  const p = store.properties.find((x) => x.id === id)!;
  return { id: p.id, name: p.name, city: p.city, submarket: p.submarket };
}

function withSummaries(store: DemoStore, lead: Lead) {
  return { ...lead, company: companySummary(store, lead.companyId), property: propertySummary(store, lead.propertyId) };
}

const byScoreThenUpdated = (a: Lead, b: Lead) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime();

// Properties

export function listProperties(filters: PropertyFilters) {
  const store = getDemoStore();
  const statusOrder = Object.values(PropertyStatus);
  return store.properties
    .filter((p) => !filters.q || [p.name, p.addressLine, p.city, p.submarket].some((v) => contains(v, filters.q!)))
    .filter((p) => !filters.type || p.propertyType === filters.type)
    .filter((p) =>
      !filters.status || filters.status === "ACTIVE"
        ? p.status !== "ARCHIVED"
        : filters.status === "ALL" || p.status === filters.status,
    )
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || byName(a, b))
    .map((p) => ({ ...p, _count: { leads: store.leads.filter((l) => l.propertyId === p.id).length } }));
}

export function getProperty(id: string) {
  const store = getDemoStore();
  const property = store.properties.find((p) => p.id === id);
  if (!property) return null;
  const leads = store.leads
    .filter((l) => l.propertyId === id)
    .sort((a, b) => b.score - a.score)
    .map((l) => ({ ...l, company: companySummary(store, l.companyId) }));
  return { ...property, leads };
}

export function getMatchingCompanies(propertyId: string, limit: number) {
  const store = getDemoStore();
  const property = store.properties.find((p) => p.id === propertyId)!;
  const now = new Date();
  return store.companies
    .map((company) => ({
      company: { id: company.id, name: company.name, industry: company.industry },
      breakdown: scorePair(store, company, property, now),
    }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total)
    .slice(0, limit);
}

// Companies

export function listCompanies(filters: { q?: string }) {
  const store = getDemoStore();
  return store.companies
    .filter((c) => !filters.q || [c.name, c.industry, c.currentCity].some((v) => contains(v, filters.q!)))
    .sort(byName)
    .map((c: TenantCompany) => {
      const signals = store.signals.filter((s) => s.companyId === c.id).sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
      const leads = store.leads.filter((l) => l.companyId === c.id);
      return {
        ...c,
        _count: { signals: signals.length, leads: leads.length },
        latestSignal: signals[0] ? { observedAt: signals[0].observedAt, type: signals[0].type } : null,
        bestScore: leads.length ? Math.max(...leads.map((l) => l.score)) : null,
      };
    });
}

export function getCompany(id: string) {
  const store = getDemoStore();
  const company = store.companies.find((c) => c.id === id);
  if (!company) return null;
  return {
    ...company,
    signals: store.signals.filter((s) => s.companyId === id).sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime()),
    leads: store.leads
      .filter((l) => l.companyId === id)
      .sort((a, b) => b.score - a.score)
      .map((l) => ({ ...l, property: propertySummary(store, l.propertyId) })),
  };
}

export function getMatchingProperties(companyId: string, limit: number) {
  const store = getDemoStore();
  const company = store.companies.find((c) => c.id === companyId)!;
  const now = new Date();
  return store.properties
    .filter((p: Property) => p.status === "AVAILABLE")
    .map((property) => ({
      property: { id: property.id, name: property.name, city: property.city, submarket: property.submarket },
      breakdown: scorePair(store, company, property, now),
    }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total)
    .slice(0, limit);
}

// Signals

export function listSignals(filters: { type?: SignalType; strength?: SignalStrength; q?: string }) {
  const store = getDemoStore();
  return store.signals
    .map((s) => ({ ...s, company: { id: s.companyId, name: store.companies.find((c) => c.id === s.companyId)!.name } }))
    .filter((s) => !filters.type || s.type === filters.type)
    .filter((s) => !filters.strength || s.strength === filters.strength)
    .filter((s) => !filters.q || contains(s.title, filters.q) || contains(s.company.name, filters.q))
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, 200);
}

// Leads

export function listLeads(filters: LeadFilters) {
  const store = getDemoStore();
  const today = startOfTodayUtc();
  const weekAhead = new Date(today.getTime() + 7 * DAY_MS);
  return store.leads
    .filter((l) =>
      !filters.status || filters.status === "ACTIVE" ? isOpen(l) : filters.status === "ALL" || l.status === filters.status,
    )
    .filter((l) => !filters.minScore || l.score >= filters.minScore)
    .filter((l) => filters.followUp !== "overdue" || (l.followUpDate != null && l.followUpDate < today))
    .filter((l) => filters.followUp !== "week" || (l.followUpDate != null && l.followUpDate < weekAhead))
    .map((l) => withSummaries(store, l))
    .filter((l) => !filters.q || contains(l.company.name, filters.q) || contains(l.property.name, filters.q))
    .sort(byScoreThenUpdated);
}

export function getLead(id: string) {
  const store = getDemoStore();
  const lead = store.leads.find((l) => l.id === id);
  if (!lead) return null;
  const company = store.companies.find((c) => c.id === lead.companyId)!;
  return {
    ...lead,
    company: {
      ...company,
      signals: store.signals
        .filter((s) => s.companyId === company.id)
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
        .slice(0, 3),
    },
    property: store.properties.find((p) => p.id === lead.propertyId)!,
    notes: store.notes.filter((n) => n.leadId === id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    breakdown: lead.scoreBreakdown as unknown as ScoreBreakdown,
  };
}

// Dashboard

export function getDashboard() {
  const store = getDemoStore();
  const today = startOfTodayUtc();
  const weekAhead = new Date(today.getTime() + 7 * DAY_MS);
  const open = store.leads.filter(isOpen);
  const statusCounts: Record<string, number> = {};
  for (const l of store.leads) statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;

  return {
    totals: {
      availableProperties: store.properties.filter((p) => p.status === "AVAILABLE").length,
      companies: store.companies.length,
      openLeads: open.length,
      overdueCount: open.filter((l) => l.followUpDate != null && l.followUpDate < today).length,
    },
    topLeads: [...open].sort((a, b) => b.score - a.score).slice(0, 8).map((l) => withSummaries(store, l)),
    followUps: open
      .filter((l) => l.followUpDate != null && l.followUpDate < weekAhead)
      .sort((a, b) => a.followUpDate!.getTime() - b.followUpDate!.getTime())
      .slice(0, 8)
      .map((l) => withSummaries(store, l)),
    statusCounts,
    recentSignals: listSignals({}).slice(0, 5),
  };
}
