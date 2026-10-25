// All matching weights and thresholds live here so they can be tuned in one place.
// The weights add up to 100, so a lead's score reads as "points out of 100".

export const SCORING_WEIGHTS = {
  size: 25,
  location: 20,
  propertyType: 15,
  budget: 15,
  timing: 10,
  signals: 15,
} as const;

export type CriterionKey = keyof typeof SCORING_WEIGHTS;

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  size: "Size fit",
  location: "Location fit",
  propertyType: "Property type fit",
  budget: "Budget fit",
  timing: "Timing fit",
  signals: "Signal strength",
};

export const SCORING_RULES = {
  // Share of the weight awarded when the company has not recorded a preference.
  unknownShare: 0.5,
  // Size: points fall to zero once the mismatch reaches this share of the requirement.
  sizeZeroAtMismatch: 0.5,
  // Location: share awarded when the city matches but not a preferred submarket.
  cityOnlyShare: 0.6,
  // Property type: share awarded for a closely related type (see RELATED_TYPES).
  relatedTypeShare: 0.5,
  // Budget: points fall to zero once the rent is this much above the maximum.
  budgetZeroAtOverrun: 0.25,
  // Timing: points fall to zero once the space is available this many days late.
  timingZeroAtDaysLate: 180,
  // Signals: value per strength, multiplied by a recency factor.
  signalStrengthValue: { LOW: 0.3, MEDIUM: 0.6, HIGH: 1 },
  signalRecency: [
    { maxAgeDays: 90, factor: 1 },
    { maxAgeDays: 180, factor: 0.6 },
    { maxAgeDays: 365, factor: 0.3 },
  ],
  // Each additional contributing signal adds this much (capped at full points).
  additionalSignalBonus: 0.15,
} as const;

// Property types that can partly satisfy each other. Lab space is specialised,
// so it is not treated as related to anything.
export const RELATED_TYPES: Record<string, string[]> = {
  OFFICE: ["MIXED_USE"],
  MIXED_USE: ["OFFICE", "RETAIL"],
  RETAIL: ["MIXED_USE"],
  INDUSTRIAL: ["LOGISTICS"],
  LOGISTICS: ["INDUSTRIAL"],
  LAB: [],
};

// Score bands shown in the interface.
export const SCORE_BANDS = [
  { min: 75, label: "Strong" },
  { min: 55, label: "Good" },
  { min: 35, label: "Moderate" },
  { min: 0, label: "Weak" },
] as const;

// Company/property pairs scoring below this are not turned into leads.
export const LEAD_SCORE_THRESHOLD = 40;

// Deal-breakers: a pair only becomes a lead if each of these scores above zero,
// however well the other criteria fit.
export const LEAD_REQUIRED_CRITERIA: CriterionKey[] = ["size", "location", "propertyType"];
