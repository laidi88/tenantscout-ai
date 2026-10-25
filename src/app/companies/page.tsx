import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ScoreBadge } from "@/components/badges";
import { FilterBar, FilterSearch } from "@/components/filter-bar";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listCompanies } from "@/lib/data/companies";
import { formatAreaRange, formatDate } from "@/lib/format";
import { SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { stringParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Companies · TenantScout AI" };

export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  const q = stringParam(await searchParams, "q");
  const companies = await listCompanies({ q });

  return (
    <>
      <PageHeader
        title="Companies"
        description="Potential tenants, their business profiles and space requirements."
        actions={
          <LinkButton href="/companies/new">
            <Plus className="h-4 w-4" aria-hidden /> Add company
          </LinkButton>
        }
      />

      <FilterBar resetHref="/companies" active={Boolean(q)}>
        <FilterSearch defaultValue={q} placeholder="Search name, industry or city" />
      </FilterBar>

      {companies.length === 0 ? (
        <EmptyState title={q ? "No companies match this search" : "No companies yet"}>
          {q ? "Try a different search." : "Add a potential tenant to start matching it with properties."}
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {companies.map((c) => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.industry}
                      {c.currentCity && ` · ${c.currentCity}`}
                      {" · Needs "}
                      {formatAreaRange(c.requiredAreaMinSqm, c.requiredAreaMaxSqm)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {c._count.signals} signal{c._count.signals === 1 ? "" : "s"}
                      {c.latestSignal &&
                        ` · latest: ${SIGNAL_TYPE_LABELS[c.latestSignal.type]}, ${formatDate(c.latestSignal.observedAt)}`}
                      {` · ${c._count.leads} lead${c._count.leads === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {c.bestScore != null && (
                    <div className="flex flex-col items-center gap-0.5">
                      <ScoreBadge score={c.bestScore} />
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">Best</span>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
