import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadStatusBadge, ScoreBadge } from "@/components/badges";
import { DeleteButton } from "@/components/delete-button";
import { ScoreBreakdownView } from "@/components/score-breakdown";
import { SignalItem } from "@/components/signal-item";
import { Badge, Card, CardBody, CardHeader, DetailList, EmptyState, PageHeader } from "@/components/ui";
import { getLead, isOverdue } from "@/lib/data/leads";
import { formatAreaRange, formatDate, formatDateTime, formatRent, toDateInput } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { addNote, deleteLead, deleteNote, updateLead } from "../actions";
import { LeadUpdateForm, NoteForm } from "./lead-forms";

export const metadata: Metadata = { title: "Lead · TenantScout AI" };

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const { company, property, breakdown } = lead;

  return (
    <>
      <PageHeader
        back={{ href: "/leads", label: "Leads" }}
        title={
          <span className="flex items-center gap-3">
            <ScoreBadge score={lead.score} size="lg" />
            <span>
              {company.name}
              <span className="block text-base font-normal text-slate-600">→ {property.name}</span>
            </span>
          </span>
        }
        actions={
          <DeleteButton
            action={deleteLead.bind(null, id)}
            label="Delete lead"
            confirmText="Delete this lead and its notes? The company and property are kept."
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader
              title={`Match score: ${lead.score} / 100 (${breakdown.band})`}
              actions={<span className="text-xs text-slate-500">Scored {formatDateTime(lead.scoredAt)} UTC</span>}
            />
            <CardBody>
              <ScoreBreakdownView breakdown={breakdown} />
              <p className="mt-4 text-xs text-slate-500">
                Scores are calculated from the recorded data with fixed rules. Use Generate matches on the Leads page to
                rescore after changing a company, property or signal.
              </p>
            </CardBody>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Company" actions={<Link href={`/companies/${company.id}`} className="text-sm text-blue-700 hover:underline">Open</Link>} />
              <CardBody>
                <DetailList
                  items={[
                    { label: "Industry", value: company.industry },
                    { label: "Space needed", value: formatAreaRange(company.requiredAreaMinSqm, company.requiredAreaMaxSqm) },
                    { label: "Maximum rent", value: formatRent(company.maxRentEurSqmMonth?.toNumber()) },
                    { label: "Target move", value: formatDate(company.targetMoveDate) },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Property" actions={<Link href={`/properties/${property.id}`} className="text-sm text-blue-700 hover:underline">Open</Link>} />
              <CardBody>
                <DetailList
                  items={[
                    { label: "Type", value: PROPERTY_TYPE_LABELS[property.propertyType] },
                    { label: "Area", value: formatAreaRange(property.minDivisibleAreaSqm, property.totalAreaSqm) },
                    { label: "Asking rent", value: formatRent(property.askingRentEurSqmMonth?.toNumber()) },
                    { label: "Available", value: property.availableFrom ? formatDate(property.availableFrom) : "Now" },
                  ]}
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Latest signals" />
            <CardBody className="divide-y divide-slate-100">
              {company.signals.length === 0 ? (
                <EmptyState title="No signals recorded for this company" />
              ) : (
                company.signals.map((s) => <SignalItem key={s.id} signal={s} />)
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Status and follow-up"
              actions={
                <span className="flex gap-1.5">
                  <LeadStatusBadge status={lead.status} />
                  {isOverdue(lead.followUpDate, lead.status) && <Badge tone="red">Follow-up overdue</Badge>}
                </span>
              }
            />
            <CardBody>
              <LeadUpdateForm
                action={updateLead.bind(null, id)}
                initial={{ status: lead.status, followUpDate: toDateInput(lead.followUpDate), ownerName: lead.ownerName ?? "" }}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Notes (${lead.notes.length})`} />
            <CardBody className="space-y-4">
              <NoteForm action={addNote.bind(null, id)} />
              {lead.notes.length > 0 && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {lead.notes.map((note) => (
                    <li key={note.id} className="py-3">
                      <p className="whitespace-pre-line text-sm text-slate-800">{note.body}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDateTime(note.createdAt)} UTC</span>
                        <DeleteButton compact label="Delete" action={deleteNote.bind(null, note.id, id)} confirmText="Delete this note?" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
