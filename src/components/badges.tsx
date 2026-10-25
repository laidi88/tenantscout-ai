import type { LeadStatus, PropertyStatus, SignalStrength } from "@/generated/prisma/enums";
import { LEAD_STATUS_LABELS, PROPERTY_STATUS_LABELS, SIGNAL_STRENGTH_LABELS } from "@/lib/labels";
import { scoreBand } from "@/lib/scoring/score";
import { Badge, cn, type BadgeTone } from "./ui";

const LEAD_STATUS_TONES: Record<LeadStatus, BadgeTone> = {
  NEW: "blue",
  CONTACTED: "violet",
  QUALIFIED: "violet",
  VIEWING: "amber",
  NEGOTIATION: "amber",
  WON: "green",
  LOST: "slate",
};

const PROPERTY_STATUS_TONES: Record<PropertyStatus, BadgeTone> = {
  AVAILABLE: "green",
  UNDER_OFFER: "amber",
  LET: "slate",
  ARCHIVED: "slate",
};

const STRENGTH_TONES: Record<SignalStrength, BadgeTone> = { LOW: "slate", MEDIUM: "blue", HIGH: "green" };

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_STATUS_TONES[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge tone={PROPERTY_STATUS_TONES[status]}>{PROPERTY_STATUS_LABELS[status]}</Badge>;
}

export function StrengthBadge({ strength }: { strength: SignalStrength }) {
  return <Badge tone={STRENGTH_TONES[strength]}>{SIGNAL_STRENGTH_LABELS[strength]} strength</Badge>;
}

const BAND_TONES: Record<string, string> = {
  Strong: "bg-emerald-600 text-white",
  Good: "bg-emerald-100 text-emerald-800",
  Moderate: "bg-amber-100 text-amber-800",
  Weak: "bg-slate-100 text-slate-600",
};

function scoreTone(score: number) {
  return BAND_TONES[scoreBand(score)];
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  return (
    <span
      title={`${scoreBand(score)} match: ${score} out of 100`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold tabular-nums",
        size === "lg" ? "h-14 w-14 text-xl" : "h-8 w-10 text-sm",
        scoreTone(score),
      )}
    >
      {score}
    </span>
  );
}
