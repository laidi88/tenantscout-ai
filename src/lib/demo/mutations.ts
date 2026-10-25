import type { LeadStatus, PropertyStatus, PropertyType, SignalStrength, SignalType } from "@/generated/prisma/enums";
import { decimal, generateDemoLeads, getDemoStore, newId, newLead, scorePair } from "./store";

// In-memory equivalents of the writes in the Server Actions. Inputs are the
// already-validated values from src/lib/validation.ts. Deletes cascade the
// same way as the database (see prisma/schema.prisma).

type PropertyInput = {
  name: string;
  addressLine: string;
  city: string;
  submarket: string | null;
  propertyType: PropertyType;
  totalAreaSqm: number;
  minDivisibleAreaSqm: number | null;
  askingRentEurSqmMonth: number | null;
  availableFrom: Date | null;
  features: string[];
  description: string | null;
  status: PropertyStatus;
};

type CompanyInput = {
  name: string;
  industry: string;
  description: string | null;
  website: string | null;
  currentCity: string | null;
  headcount: number | null;
  currentAreaSqm: number | null;
  requiredAreaMinSqm: number | null;
  requiredAreaMaxSqm: number | null;
  preferredCities: string[];
  preferredSubmarkets: string[];
  preferredPropertyTypes: PropertyType[];
  maxRentEurSqmMonth: number | null;
  targetMoveDate: Date | null;
};

type SignalInput = {
  type: SignalType;
  title: string;
  summary: string | null;
  sourceUrl: string;
  sourceName: string | null;
  observedAt: Date;
  strength: SignalStrength;
};

function removeLeads(predicate: (lead: { id: string; companyId: string; propertyId: string }) => boolean) {
  const store = getDemoStore();
  const removed = new Set(store.leads.filter(predicate).map((l) => l.id));
  store.leads = store.leads.filter((l) => !removed.has(l.id));
  store.notes = store.notes.filter((n) => !removed.has(n.leadId));
}

// Properties

export function createProperty(input: PropertyInput) {
  const now = new Date();
  const property = { ...input, id: newId(), askingRentEurSqmMonth: decimal(input.askingRentEurSqmMonth), createdAt: now, updatedAt: now };
  getDemoStore().properties.push(property);
  return property;
}

export function updateProperty(id: string, input: PropertyInput) {
  const property = getDemoStore().properties.find((p) => p.id === id);
  if (!property) throw new Error("Property not found.");
  Object.assign(property, { ...input, askingRentEurSqmMonth: decimal(input.askingRentEurSqmMonth), updatedAt: new Date() });
}

export function deleteProperty(id: string) {
  const store = getDemoStore();
  store.properties = store.properties.filter((p) => p.id !== id);
  removeLeads((l) => l.propertyId === id);
}

// Companies and signals

export function createCompany(input: CompanyInput) {
  const now = new Date();
  const company = {
    ...input,
    id: newId(),
    maxRentEurSqmMonth: decimal(input.maxRentEurSqmMonth),
    externalId: null,
    externalSource: null,
    lastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  getDemoStore().companies.push(company);
  return company;
}

export function updateCompany(id: string, input: CompanyInput) {
  const company = getDemoStore().companies.find((c) => c.id === id);
  if (!company) throw new Error("Company not found.");
  Object.assign(company, { ...input, maxRentEurSqmMonth: decimal(input.maxRentEurSqmMonth), updatedAt: new Date() });
}

export function deleteCompany(id: string) {
  const store = getDemoStore();
  store.companies = store.companies.filter((c) => c.id !== id);
  store.signals = store.signals.filter((s) => s.companyId !== id);
  removeLeads((l) => l.companyId === id);
}

export function addSignal(companyId: string, input: SignalInput) {
  const now = new Date();
  getDemoStore().signals.push({ ...input, id: newId(), companyId, origin: "MANUAL", createdAt: now, updatedAt: now });
}

export function deleteSignal(id: string) {
  const store = getDemoStore();
  store.signals = store.signals.filter((s) => s.id !== id);
}

// Leads and notes

/** Returns the lead ID for the pair, creating and scoring the lead if needed. */
export function createLead(companyId: string, propertyId: string): string {
  const store = getDemoStore();
  const existing = store.leads.find((l) => l.companyId === companyId && l.propertyId === propertyId);
  if (existing) return existing.id;
  const company = store.companies.find((c) => c.id === companyId);
  const property = store.properties.find((p) => p.id === propertyId);
  if (!company || !property) throw new Error("Company or property not found.");
  const now = new Date();
  const lead = newLead(companyId, propertyId, scorePair(store, company, property, now), now);
  store.leads.push(lead);
  return lead.id;
}

export function generateLeads() {
  return generateDemoLeads(getDemoStore());
}

export function updateLead(id: string, input: { status: LeadStatus; followUpDate: Date | null; ownerName: string | null }) {
  const lead = getDemoStore().leads.find((l) => l.id === id);
  if (!lead) throw new Error("Lead not found.");
  Object.assign(lead, { ...input, updatedAt: new Date() });
}

export function deleteLead(id: string) {
  removeLeads((l) => l.id === id);
}

export function addNote(leadId: string, body: string) {
  getDemoStore().notes.push({ id: newId(), leadId, body, author: null, createdAt: new Date() });
}

export function deleteNote(id: string) {
  const store = getDemoStore();
  store.notes = store.notes.filter((n) => n.id !== id);
}
