"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { LEAD_SCORE_THRESHOLD } from "@/lib/scoring/config";
import { generateMatches } from "./actions";

// Scores every company against every available property and creates leads
// for strong pairs. Existing leads keep their status and notes.
export function GenerateMatchesButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const [state, action, pending] = useActionState(generateMatches, {});

  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="submit"
        disabled={pending}
        className={buttonClass(variant)}
        title={`Creates leads for pairs scoring ${LEAD_SCORE_THRESHOLD} or more, and rescores existing leads.`}
      >
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
        {pending ? "Generating…" : "Generate matches"}
      </button>
      {state.message && (
        <p role="status" className="max-w-sm text-xs text-slate-600 sm:text-right">
          {state.message}
        </p>
      )}
    </form>
  );
}
