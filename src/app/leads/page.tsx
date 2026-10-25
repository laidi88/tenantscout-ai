import type { Metadata } from "next";
import Link from "next/link";
import { LeadStatusBadge, ScoreBadge } from "@/components/badges";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { LeadStatus } from "@/generated/prisma/enums";
import { isOverdue, listLeads } from "@/lib/data/leads";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS, options } from "@/lib/labels";
import { enumParam, stringParam } from "@/lib/search-params";
import { GenerateMatchesButton } from "./generate-button";

export const metadata: Metadata = { title: "Leads · TenantScout AI" };

const STATUS_FILTERS = ["ACTIVE", "ALL", ...Object.values(LeadStatus)] as const;
const MIN_SCORES = ["75", "55", "35"] as const;

function FollowUp({ date, overdue }: { date: Date | null; overdue: boolean }) {
  if (!date) return <span className="text-slate-400">—</span>;
  return overdue ? <Badge tone="red">Overdue · {formatDate(date)}</Badge> : <span>{formatDate(date)}</span>;
}

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const sp = await searchParams;
  const minScore = enumParam(sp, "minScore", MIN_SCORES);
  const filters = {
    q: stringParam(sp, "q"),
    status: enumParam(sp, "status", STATUS_FILTERS),
    minScore: minScore ? Number(minScore) : undefined,
    followUp: enumParam(sp, "followUp", ["overdue", "week"] as const),
  };
  const leads = await listLeads(filters);
  const filtered = Boolean(filters.q || filters.status || filters.minScore || filters.followUp);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Company and property pairs, ranked by match score. Open a lead to see how its score is made up."
        actions={<GenerateMatchesButton />}
      />

      <FilterBar resetHref="/leads" active={filtered}>
        <FilterSearch defaultValue={filters.q} placeholder="Search company or property" />
        <FilterSelect
          name="status"
          label="Status"
          defaultValue={filters.status}
          options={[{ value: "", label: "Open leads" }, { value: "ALL", label: "All statuses" }, ...options(LEAD_STATUS_LABELS)]}
        />
        <FilterSelect
          name="minScore"
          label="Minimum score"
          defaultValue={minScore}
          options={[
            { value: "", label: "Any score" },
            { value: "75", label: "Strong (75+)" },
            { value: "55", label: "Good or better (55+)" },
            { value: "35", label: "Moderate or better (35+)" },
          ]}
        />
        <FilterSelect
          name="followUp"
          label="Follow-up"
          defaultValue={filters.followUp}
          options={[
            { value: "", label: "Any follow-up" },
            { value: "overdue", label: "Overdue" },
            { value: "week", label: "Due within 7 days" },
          ]}
        />
      </FilterBar>

      {leads.length === 0 ? (
        <EmptyState title={filtered ? "No leads match these filters" : "No leads yet"}>
          {filtered
            ? "Try clearing the filters."
            : "Add properties and companies, then use Generate matches to create leads from the best pairs."}
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Follow-up</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} aria-label={`Open lead: ${lead.company.name} – ${lead.property.name}`}>
                      <ScoreBadge score={lead.score} />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                      {lead.company.name}
                    </Link>
                    <p className="text-xs text-slate-500">{lead.company.industry}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{lead.property.name}</p>
                    <p className="text-xs text-slate-500">
                      {lead.property.submarket ? `${lead.property.submarket}, ` : ""}
                      {lead.property.city}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    <FollowUp date={lead.followUpDate} overdue={isOverdue(lead.followUpDate, lead.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.ownerName ?? <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-slate-100 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className="flex gap-3 px-4 py-3 hover:bg-slate-50">
                  <ScoreBadge score={lead.score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-900">{lead.company.name}</span>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {lead.property.name} · {lead.property.city}
                    </p>
                    {lead.followUpDate && (
                      <p className="mt-1 text-xs text-slate-600">
                        Follow-up: <FollowUp date={lead.followUpDate} overdue={isOverdue(lead.followUpDate, lead.status)} />
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
