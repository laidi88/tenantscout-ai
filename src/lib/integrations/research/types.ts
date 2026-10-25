import type { SignalOrigin, SignalStrength, SignalType } from "@/generated/prisma/enums";

// Extension point for automated company research. A provider looks up public
// information about a company and returns candidate signals. Nothing here runs
// automatically today: only the manual provider exists, and signals are typed
// in by users. See docs/integrations.md.

export type ResearchCompany = {
  id: string;
  name: string;
  website: string | null;
  currentCity: string | null;
};

export type SignalCandidate = {
  type: SignalType;
  title: string;
  summary: string | null;
  sourceUrl: string; // required: every signal must point to its public source
  sourceName: string | null;
  observedAt: Date;
  strength: SignalStrength;
};

export interface SignalProvider {
  /** Stable identifier, e.g. "manual" or "news-api". */
  id: string;
  /** Name shown to users. */
  label: string;
  /** Recorded on each signal so the interface can say where it came from. */
  origin: SignalOrigin;
  /** False until the provider's credentials or data source are set up. */
  isConfigured(): boolean;
  /** Returns candidate signals for review; callers decide whether to save them. */
  fetchSignals(company: ResearchCompany): Promise<SignalCandidate[]>;
}
