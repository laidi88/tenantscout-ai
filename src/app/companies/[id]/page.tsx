import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadStatusBadge, ScoreBadge } from "@/components/badges";
import { DeleteButton } from "@/components/delete-button";
import { MatchList } from "@/components/match-list";
import { SignalItem } from "@/components/signal-item";
import { Badge, Card, CardBody, CardHeader, DetailList, EmptyState, ExternalLink, LinkButton, PageHeader } from "@/components/ui";
import { getCompany, getMatchingProperties } from "@/lib/data/companies";
import { formatArea, formatAreaRange, formatDate, formatRent, hostname, toDateInput } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { addSignal, deleteSignal } from "../actions";
import { SignalForm } from "./signal-form";

export const metadata: Metadata = { title: "Company · TenantScout AI" };

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const matches = await getMatchingProperties(id);
  const leadByProperty = new Map(company.leads.map((l) => [l.propertyId, l.id]));
  const list = (items: string[]) => (items.length ? items.join(", ") : "Any");

  return (
    <>
      <PageHeader
        back={{ href: "/companies", label: "Companies" }}
        title={company.name}
        description={
          <>
            {company.industry}
            {company.currentCity && ` · Currently in ${company.currentCity}`}
            {company.website && (
              <>
                {" · "}
                <ExternalLink href={company.website}>{hostname(company.website)}</ExternalLink>
              </>
            )}
          </>
        }
        actions={
          <LinkButton href={`/companies/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="Business profile and requirement" />
            <CardBody className="space-y-5">
              {company.description && <p className="whitespace-pre-line text-sm text-slate-700">{company.description}</p>}
              <DetailList
                items={[
                  { label: "Headcount", value: company.headcount?.toLocaleString("en-GB") ?? "—" },
                  { label: "Current space", value: formatArea(company.currentAreaSqm) },
                  { label: "Space needed", value: formatAreaRange(company.requiredAreaMinSqm, company.requiredAreaMaxSqm) },
                  { label: "Maximum rent", value: formatRent(company.maxRentEurSqmMonth?.toNumber()) },
                  { label: "Preferred cities", value: list(company.preferredCities) },
                  { label: "Preferred submarkets", value: list(company.preferredSubmarkets) },
                  {
                    label: "Preferred types",
                    value: company.preferredPropertyTypes.length ? (
                      <span className="flex flex-wrap gap-1">
                        {company.preferredPropertyTypes.map((t) => (
                          <Badge key={t}>{PROPERTY_TYPE_LABELS[t]}</Badge>
                        ))}
                      </span>
                    ) : (
                      "Any"
                    ),
                  },
                  { label: "Target move date", value: formatDate(company.targetMoveDate) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Signals (${company.signals.length})`} />
            <CardBody className="space-y-5">
              {company.signals.length === 0 ? (
                <EmptyState title="No signals recorded">
                  Add publicly reported news about expansion, relocation, hiring or funding, with a link to the source.
                </EmptyState>
              ) : (
                <div className="divide-y divide-slate-100">
                  {company.signals.map((s) => (
                    <SignalItem
                      key={s.id}
                      signal={s}
                      actions={
                        <DeleteButton compact label="Remove" action={deleteSignal.bind(null, s.id, id)} confirmText="Remove this signal?" />
                      }
                    />
                  ))}
                </div>
              )}
              <details className="group rounded-lg border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <span className="group-open:hidden">+ Add a signal</span>
                  <span className="hidden group-open:inline">Add a signal</span>
                </summary>
                <div className="border-t border-slate-200 px-4 py-4">
                  <SignalForm action={addSignal.bind(null, id)} today={toDateInput(new Date())} />
                </div>
              </details>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Leads (${company.leads.length})`} />
            <CardBody>
              {company.leads.length === 0 ? (
                <EmptyState title="No leads for this company yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {company.leads.map((lead) => (
                    <li key={lead.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <ScoreBadge score={lead.score} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                          {lead.property.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {lead.property.submarket ? `${lead.property.submarket}, ` : ""}
                          {lead.property.city}
                        </p>
                      </div>
                      <LeadStatusBadge status={lead.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader title="Best matching properties" />
          <CardBody>
            <p className="mb-4 text-xs text-slate-500">
              Scored live against every available property. Lower-scoring criteria are shown as the reason.
            </p>
            <MatchList
              emptyText="No available properties yet"
              items={matches.map((m) => ({
                companyId: id,
                propertyId: m.property.id,
                title: m.property.name,
                subtitle: `${m.property.submarket ? `${m.property.submarket}, ` : ""}${m.property.city}`,
                href: `/properties/${m.property.id}`,
                breakdown: m.breakdown,
                leadId: leadByProperty.get(m.property.id),
              }))}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
