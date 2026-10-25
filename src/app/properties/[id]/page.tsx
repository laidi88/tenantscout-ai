import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadStatusBadge, PropertyStatusBadge, ScoreBadge } from "@/components/badges";
import { MatchList } from "@/components/match-list";
import { Badge, Card, CardBody, CardHeader, DetailList, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getMatchingCompanies, getProperty } from "@/lib/data/properties";
import { formatArea, formatDate, formatRent } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Property · TenantScout AI" };

export default async function PropertyPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const matches = await getMatchingCompanies(id);
  const leadByCompany = new Map(property.leads.map((l) => [l.companyId, l.id]));

  return (
    <>
      <PageHeader
        back={{ href: "/properties", label: "Properties" }}
        title={property.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {property.addressLine}, {property.submarket ? `${property.submarket}, ` : ""}
            {property.city}
            <PropertyStatusBadge status={property.status} />
          </span>
        }
        actions={
          <LinkButton href={`/properties/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-5">
              <DetailList
                items={[
                  { label: "Type", value: PROPERTY_TYPE_LABELS[property.propertyType] },
                  { label: "Total area", value: formatArea(property.totalAreaSqm) },
                  {
                    label: "Smallest unit",
                    value: property.minDivisibleAreaSqm ? formatArea(property.minDivisibleAreaSqm) : "Not divisible",
                  },
                  { label: "Asking rent", value: formatRent(property.askingRentEurSqmMonth?.toNumber()) },
                  { label: "Available from", value: property.availableFrom ? formatDate(property.availableFrom) : "Now" },
                  { label: "Last updated", value: formatDate(property.updatedAt) },
                ]}
              />
              {property.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {property.features.map((f) => (
                    <Badge key={f}>{f}</Badge>
                  ))}
                </div>
              )}
              {property.description && <p className="whitespace-pre-line text-sm text-slate-700">{property.description}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Leads (${property.leads.length})`} />
            <CardBody>
              {property.leads.length === 0 ? (
                <EmptyState title="No leads for this property yet">
                  Create one from the best matches, or generate matches on the Leads page.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {property.leads.map((lead) => (
                    <li key={lead.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <ScoreBadge score={lead.score} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                          {lead.company.name}
                        </Link>
                        <p className="text-xs text-slate-500">{lead.company.industry}</p>
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
          <CardHeader title="Best matching companies" />
          <CardBody>
            <p className="mb-4 text-xs text-slate-500">
              Scored live against every company. Lower-scoring criteria are shown as the reason.
            </p>
            <MatchList
              emptyText="No companies recorded yet"
              items={matches.map((m) => ({
                companyId: m.company.id,
                propertyId: id,
                title: m.company.name,
                subtitle: m.company.industry,
                href: `/companies/${m.company.id}`,
                breakdown: m.breakdown,
                leadId: leadByCompany.get(m.company.id),
              }))}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
