import type {
  LeadStatus,
  PropertyStatus,
  PropertyType,
  SignalOrigin,
  SignalStrength,
  SignalType,
} from "@/generated/prisma/enums";

// Human-readable labels for every enum value. Safe to import in client components.

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  OFFICE: "Office",
  RETAIL: "Retail",
  INDUSTRIAL: "Industrial",
  LOGISTICS: "Logistics",
  LAB: "Lab",
  MIXED_USE: "Mixed-Use",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  AVAILABLE: "Available",
  UNDER_OFFER: "Under offer",
  LET: "Let",
  ARCHIVED: "Archived",
};

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  EXPANSION: "Expansion",
  RELOCATION: "Relocation",
  FUNDING: "Funding",
  HIRING: "Hiring",
  LEASE_EXPIRY: "Lease expiry",
  NEW_OFFICE: "New office",
  OTHER: "Other",
};

export const SIGNAL_STRENGTH_LABELS: Record<SignalStrength, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const SIGNAL_ORIGIN_LABELS: Record<SignalOrigin, string> = {
  MANUAL: "Recorded manually",
  IMPORT: "Imported",
  AUTOMATED: "Automated",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIEWING: "Viewing",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

// Leads in these statuses are finished and drop out of active lists.
export const CLOSED_LEAD_STATUSES: LeadStatus[] = ["WON", "LOST"];

export function options<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
