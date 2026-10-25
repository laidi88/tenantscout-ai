import Link from "next/link";
import { LeadStatusBadge, ScoreBadge } from "@/components/badges";
import { SignalItem } from "@/components/signal-item";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatTile } from "@/components/ui";
import { LeadStatus } from "@/generated/prisma/enums";
import { getDashboard } from "@/lib/data/dashboard";
import { isOverdue } from "@/lib/data/leads";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { GenerateMatchesButton } from "./leads/generate-button";

const viewAll = (href: string) => (
  <Link href={href} className="text-sm text-blue-700 hover:underline">
    View all
  </Link>
);

export default async function DashboardPage() {
  const { totals, topLeads, followUps, statusCounts, recentSignals } = await getDashboard();
  const pipelineMax = Math.max(1, ...Object.values(statusCounts));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="The most promising tenant opportunities, ranked by transparent match scores."
        actions={<GenerateMatchesButton variant="secondary" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Available properties" value={totals.availableProperties} />
        <StatTile label="Companies tracked" value={totals.companies} />
        <StatTile label="Open leads" value={totals.openLeads} />
        <StatTile
          label="Overdue follow-ups"
          value={<span className={totals.overdueCount ? "text-red-600" : undefined}>{totals.overdueCount}</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Top opportunities" actions={viewAll("/leads")} />
          <CardBody>
            {topLeads.length === 0 ? (
              <EmptyState title="No open leads yet">Use Generate matches to create leads from the best company/property pairs.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/leads/${lead.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                      <ScoreBadge score={lead.score} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{lead.company.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {lead.property.name} · {lead.property.submarket ? `${lead.property.submarket}, ` : ""}
                          {lead.property.city}
                        </p>
                      </div>
                      <LeadStatusBadge status={lead.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Follow-ups due" actions={viewAll("/leads?followUp=week")} />
            <CardBody>
              {followUps.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing due in the next 7 days.</p>
              ) : (
                <ul className="space-y-2.5">
                  {followUps.map((lead) => (
                    <li key={lead.id} className="flex items-start justify-between gap-3">
                      <Link href={`/leads/${lead.id}`} className="min-w-0 text-sm hover:underline">
                        <span className="font-medium text-slate-900">{lead.company.name}</span>
                        <span className="block truncate text-xs text-slate-500">{lead.property.name}</span>
                      </Link>
                      {isOverdue(lead.followUpDate, lead.status) ? (
                        <Badge tone="red">{formatDate(lead.followUpDate)}</Badge>
                      ) : (
                        <Badge tone="amber">{formatDate(lead.followUpDate)}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pipeline" />
            <CardBody>
              <ul className="space-y-2">
                {Object.values(LeadStatus).map((status) => {
                  const count = statusCounts[status] ?? 0;
                  return (
                    <li key={status}>
                      <Link href={`/leads?status=${status}`} className="group grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-sm">
                        <span className="text-slate-700 group-hover:underline">{LEAD_STATUS_LABELS[status]}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <span className="block h-full rounded-full bg-slate-700" style={{ width: `${(count / pipelineMax) * 100}%` }} />
                        </span>
                        <span className="text-right tabular-nums text-slate-700">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-5">
          <CardHeader title="Recent signals" actions={viewAll("/signals")} />
          <CardBody className="divide-y divide-slate-100">
            {recentSignals.length === 0 ? (
              <p className="text-sm text-slate-500">No signals recorded yet. Add them from a company&apos;s page.</p>
            ) : (
              recentSignals.map((s) => <SignalItem key={s.id} signal={s} company={s.company} />)
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
