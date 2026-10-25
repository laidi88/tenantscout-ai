import type { SignalProvider } from "./types";

export type { ResearchCompany, SignalCandidate, SignalProvider } from "./types";

// Signals are currently entered by hand on a company's page, so the manual
// provider has nothing to fetch. It exists so code that lists providers has a
// real, honest entry rather than a placeholder that pretends to search the web.
export const manualProvider: SignalProvider = {
  id: "manual",
  label: "Recorded manually",
  origin: "MANUAL",
  isConfigured: () => true,
  fetchSignals: async () => [],
};

// Add new providers here once they are implemented and tested.
const PROVIDERS: SignalProvider[] = [manualProvider];

export function getSignalProviders(): SignalProvider[] {
  return PROVIDERS;
}

/** True only when at least one automated (non-manual) provider is configured. */
export function hasAutomatedResearch(): boolean {
  return PROVIDERS.some((p) => p.origin !== "MANUAL" && p.isConfigured());
}
