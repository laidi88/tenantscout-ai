import type { ScoreBreakdown } from "@/lib/scoring/score";

// Shows each scoring criterion with its points and the reason behind them.
export function ScoreBreakdownView({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <ul className="divide-y divide-slate-100">
      {breakdown.criteria.map((c) => {
        const pct = c.maxPoints === 0 ? 0 : (c.points / c.maxPoints) * 100;
        return (
          <li key={c.key} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-900">{c.label}</span>
              <span className="text-sm tabular-nums text-slate-700">
                <span className="font-semibold">{c.points}</span> / {c.maxPoints}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={pct >= 75 ? "h-full bg-emerald-500" : pct >= 40 ? "h-full bg-amber-400" : "h-full bg-slate-400"}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm text-slate-600">{c.reason}</p>
          </li>
        );
      })}
    </ul>
  );
}
