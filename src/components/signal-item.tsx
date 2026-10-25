import Link from "next/link";
import type { Signal } from "@/generated/prisma/client";
import { formatDate, hostname } from "@/lib/format";
import { SIGNAL_ORIGIN_LABELS, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { StrengthBadge } from "./badges";
import { Badge, ExternalLink } from "./ui";

// One signal with its source link and how it was recorded.
export function SignalItem({
  signal,
  company,
  actions,
}: {
  signal: Signal;
  company?: { id: string; name: string };
  actions?: React.ReactNode;
}) {
  return (
    <article className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="violet">{SIGNAL_TYPE_LABELS[signal.type]}</Badge>
        <StrengthBadge strength={signal.strength} />
        <span className="text-xs text-slate-500">{formatDate(signal.observedAt)}</span>
      </div>
      <h3 className="mt-1 text-sm font-medium text-slate-900">
        {company && (
          <>
            <Link href={`/companies/${company.id}`} className="hover:underline">
              {company.name}
            </Link>
            <span className="text-slate-400"> · </span>
          </>
        )}
        {signal.title}
      </h3>
      {signal.summary && <p className="mt-0.5 text-sm text-slate-600">{signal.summary}</p>}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>
          Source: <ExternalLink href={signal.sourceUrl}>{signal.sourceName || hostname(signal.sourceUrl)}</ExternalLink>
        </span>
        <span>{SIGNAL_ORIGIN_LABELS[signal.origin]}</span>
        {actions}
      </div>
    </article>
  );
}
