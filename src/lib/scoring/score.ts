import {
  CRITERION_LABELS,
  RELATED_TYPES,
  SCORE_BANDS,
  SCORING_RULES,
  SCORING_WEIGHTS,
  type CriterionKey,
} from "./config";

// Plain inputs, independent of Prisma, so scoring can be tested without a database.
export type ScoringCompany = {
  requiredAreaMinSqm: number | null;
  requiredAreaMaxSqm: number | null;
  preferredCities: string[];
  preferredSubmarkets: string[];
  preferredPropertyTypes: string[];
  maxRentEurSqmMonth: number | null;
  targetMoveDate: Date | null;
};

export type ScoringProperty = {
  city: string;
  submarket: string | null;
  propertyType: string;
  totalAreaSqm: number;
  minDivisibleAreaSqm: number | null;
  askingRentEurSqmMonth: number | null;
  availableFrom: Date | null;
};

export type ScoringSignal = {
  observedAt: Date;
  strength: keyof typeof SCORING_RULES.signalStrengthValue;
};

export type CriterionResult = {
  key: CriterionKey;
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
};

export type ScoreBreakdown = {
  total: number;
  band: string;
  criteria: CriterionResult[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const sqm = (n: number) => `${n.toLocaleString("en-GB")} m²`;
const eur = (n: number) => `€${n.toFixed(2)}/m²/month`;
const day = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function criterion(key: CriterionKey, share: number, reason: string): CriterionResult {
  const maxPoints = SCORING_WEIGHTS[key];
  return {
    key,
    label: CRITERION_LABELS[key],
    points: Math.round(clamp01(share) * maxPoints),
    maxPoints,
    reason,
  };
}

function scoreSize(c: ScoringCompany, p: ScoringProperty): CriterionResult {
  const reqMin = c.requiredAreaMinSqm ?? c.requiredAreaMaxSqm;
  const reqMax = c.requiredAreaMaxSqm ?? c.requiredAreaMinSqm;
  if (reqMin == null || reqMax == null) {
    return criterion("size", SCORING_RULES.unknownShare, "No space requirement recorded for this company.");
  }

  // The property can be let anywhere between its smallest divisible unit and its total area.
  const availMin = p.minDivisibleAreaSqm ?? p.totalAreaSqm;
  const availMax = p.totalAreaSqm;
  const need = reqMin === reqMax ? sqm(reqMin) : `${sqm(reqMin)}–${sqm(reqMax)}`;
  const offer = availMin === availMax ? sqm(availMax) : `${sqm(availMin)}–${sqm(availMax)}`;

  if (availMax >= reqMin && availMin <= reqMax) {
    return criterion("size", 1, `Needs ${need}; property offers ${offer}.`);
  }
  const tooSmall = availMax < reqMin;
  const mismatch = tooSmall ? (reqMin - availMax) / reqMin : (availMin - reqMax) / reqMax;
  const share = 1 - mismatch / SCORING_RULES.sizeZeroAtMismatch;
  const pct = Math.round(mismatch * 100);
  return criterion(
    "size",
    share,
    tooSmall
      ? `Needs ${need}; property offers ${offer} (${pct}% too small).`
      : `Needs ${need}; smallest unit is ${sqm(availMin)} (${pct}% too large).`,
  );
}

function scoreLocation(c: ScoringCompany, p: ScoringProperty): CriterionResult {
  if (c.preferredCities.length === 0 && c.preferredSubmarkets.length === 0) {
    return criterion("location", SCORING_RULES.unknownShare, "No location preference recorded.");
  }
  const place = p.submarket ? `${p.submarket}, ${p.city}` : p.city;
  if (p.submarket && c.preferredSubmarkets.some((s) => same(s, p.submarket!))) {
    return criterion("location", 1, `${place} is a preferred submarket.`);
  }
  const cityMatch = c.preferredCities.some((s) => same(s, p.city));
  if (cityMatch && c.preferredSubmarkets.length === 0) {
    return criterion("location", 1, `${p.city} is a preferred city.`);
  }
  if (cityMatch) {
    return criterion(
      "location",
      SCORING_RULES.cityOnlyShare,
      `${p.city} is a preferred city, but ${p.submarket ?? "this area"} is not a preferred submarket.`,
    );
  }
  return criterion("location", 0, `${place} is outside the preferred locations.`);
}

function scorePropertyType(c: ScoringCompany, p: ScoringProperty): CriterionResult {
  const type = formatType(p.propertyType);
  if (c.preferredPropertyTypes.length === 0) {
    return criterion("propertyType", SCORING_RULES.unknownShare, "No property type preference recorded.");
  }
  if (c.preferredPropertyTypes.includes(p.propertyType)) {
    return criterion("propertyType", 1, `${type} is a preferred property type.`);
  }
  const related = RELATED_TYPES[p.propertyType] ?? [];
  if (c.preferredPropertyTypes.some((t) => related.includes(t))) {
    return criterion(
      "propertyType",
      SCORING_RULES.relatedTypeShare,
      `${type} is closely related to a preferred type (${c.preferredPropertyTypes.map(formatType).join(", ")}).`,
    );
  }
  return criterion(
    "propertyType",
    0,
    `${type} does not match the preferred types (${c.preferredPropertyTypes.map(formatType).join(", ")}).`,
  );
}

function scoreBudget(c: ScoringCompany, p: ScoringProperty): CriterionResult {
  if (c.maxRentEurSqmMonth == null) {
    return criterion("budget", SCORING_RULES.unknownShare, "No rent budget recorded for this company.");
  }
  if (p.askingRentEurSqmMonth == null) {
    return criterion("budget", SCORING_RULES.unknownShare, "No asking rent recorded for this property.");
  }
  const rent = p.askingRentEurSqmMonth;
  const max = c.maxRentEurSqmMonth;
  if (rent <= max) {
    return criterion("budget", 1, `Asking rent ${eur(rent)} is within the budget of ${eur(max)}.`);
  }
  const overrun = (rent - max) / max;
  return criterion(
    "budget",
    1 - overrun / SCORING_RULES.budgetZeroAtOverrun,
    `Asking rent ${eur(rent)} is ${Math.round(overrun * 100)}% above the budget of ${eur(max)}.`,
  );
}

function scoreTiming(c: ScoringCompany, p: ScoringProperty, now: Date): CriterionResult {
  if (c.targetMoveDate == null) {
    return criterion("timing", SCORING_RULES.unknownShare, "No target move date recorded.");
  }
  const available = p.availableFrom ?? now;
  const availableText = p.availableFrom && p.availableFrom > now ? `from ${day(p.availableFrom)}` : "now";
  const daysLate = Math.ceil((available.getTime() - c.targetMoveDate.getTime()) / DAY_MS);
  if (daysLate <= 0) {
    return criterion(
      "timing",
      1,
      `Available ${availableText}, before the target move date of ${day(c.targetMoveDate)}.`,
    );
  }
  return criterion(
    "timing",
    1 - daysLate / SCORING_RULES.timingZeroAtDaysLate,
    `Available ${availableText}, ${daysLate} days after the target move date of ${day(c.targetMoveDate)}.`,
  );
}

function signalValue(s: ScoringSignal, now: Date): number {
  const ageDays = (now.getTime() - s.observedAt.getTime()) / DAY_MS;
  const recency = SCORING_RULES.signalRecency.find((r) => ageDays <= r.maxAgeDays);
  return recency ? SCORING_RULES.signalStrengthValue[s.strength] * recency.factor : 0;
}

function scoreSignals(signals: ScoringSignal[], now: Date): CriterionResult {
  if (signals.length === 0) {
    return criterion("signals", 0, "No expansion or relocation signals recorded.");
  }
  const values = signals.map((s) => signalValue(s, now)).filter((v) => v > 0).sort((a, b) => b - a);
  if (values.length === 0) {
    return criterion("signals", 0, `${signals.length} signal(s) recorded, all older than 12 months.`);
  }
  const share = values[0] + SCORING_RULES.additionalSignalBonus * (values.length - 1);
  const countText = values.length === 1 ? "1 recent signal" : `${values.length} recent signals`;
  const strongest = signals.reduce((best, s) => (signalValue(s, now) > signalValue(best, now) ? s : best));
  return criterion(
    "signals",
    share,
    `${countText} in the last 12 months; strongest is ${strongest.strength.toLowerCase()} strength from ${day(strongest.observedAt)}.`,
  );
}

export function scoreBand(total: number): string {
  return SCORE_BANDS.find((b) => total >= b.min)?.label ?? "Weak";
}

export function formatType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join("-");
}

/**
 * Scores how well a property suits a company. Every criterion returns its
 * points and a plain-English reason, so the total is fully explainable.
 */
export function scoreMatch(
  company: ScoringCompany,
  property: ScoringProperty,
  signals: ScoringSignal[],
  now: Date = new Date(),
): ScoreBreakdown {
  const criteria = [
    scoreSize(company, property),
    scoreLocation(company, property),
    scorePropertyType(company, property),
    scoreBudget(company, property),
    scoreTiming(company, property, now),
    scoreSignals(signals, now),
  ];
  const total = criteria.reduce((sum, c) => sum + c.points, 0);
  return { total, band: scoreBand(total), criteria };
}
