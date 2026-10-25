import Link from "next/link";
import { createLead } from "@/app/leads/actions";
import type { ScoreBreakdown } from "@/lib/scoring/score";
import { ScoreBadge } from "./badges";
import { SubmitButton } from "./form";
import { EmptyState } from "./ui";

export type MatchItem = {
  companyId: string;
  propertyId: string;
  title: string;
  href: string;
  subtitle: string;
  breakdown: ScoreBreakdown;
  leadId?: string;
};

// Live "best matches" list for a property or company. Each item shows the
// score, the two weakest criteria as a quick explanation, and either a link to
// the existing lead or a button to create one.
export function MatchList({ items, emptyText }: { items: MatchItem[]; emptyText: string }) {
  if (items.length === 0) return <EmptyState title={emptyText} />;

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const weakest = [...item.breakdown.criteria]
          .sort((a, b) => a.points / a.maxPoints - b.points / b.maxPoints)
          .filter((c) => c.points < c.maxPoints)
          .slice(0, 2);
        return (
          <li key={`${item.companyId}:${item.propertyId}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <ScoreBadge score={item.breakdown.total} />
            <div className="min-w-0 flex-1">
              <Link href={item.href} className="font-medium text-slate-900 hover:underline">
                {item.title}
              </Link>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
              {weakest.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {weakest.map((c) => (
                    <li key={c.key}>
                      <span className="font-medium">
                        {c.label} {c.points}/{c.maxPoints}:
                      </span>{" "}
                      {c.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-600">Meets every criterion in full.</p>
              )}
            </div>
            <div className="shrink-0">
              {item.leadId ? (
                <Link href={`/leads/${item.leadId}`} className="text-sm font-medium text-blue-700 hover:underline">
                  View lead
                </Link>
              ) : (
                <form action={createLead.bind(null, item.companyId, item.propertyId)}>
                  <SubmitButton variant="secondary" pendingText="Creating…">
                    Create lead
                  </SubmitButton>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
