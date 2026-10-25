import type { Metadata } from "next";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { SignalItem } from "@/components/signal-item";
import { Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { SignalStrength, SignalType } from "@/generated/prisma/enums";
import { listSignals } from "@/lib/data/signals";
import { options, SIGNAL_STRENGTH_LABELS, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { enumParam, stringParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Signals · TenantScout AI" };

export default async function SignalsPage({ searchParams }: PageProps<"/signals">) {
  const sp = await searchParams;
  const filters = {
    q: stringParam(sp, "q"),
    type: enumParam(sp, "type", Object.values(SignalType)),
    strength: enumParam(sp, "strength", Object.values(SignalStrength)),
  };
  const signals = await listSignals(filters);
  const filtered = Boolean(filters.q || filters.type || filters.strength);

  return (
    <>
      <PageHeader
        title="Signals"
        description="Publicly reported expansion, relocation, hiring and funding news, recorded manually with a source link. Add new signals from a company's page."
      />

      <FilterBar resetHref="/signals" active={filtered}>
        <FilterSearch defaultValue={filters.q} placeholder="Search headline or company" />
        <FilterSelect name="type" label="Signal type" defaultValue={filters.type} options={[{ value: "", label: "All types" }, ...options(SIGNAL_TYPE_LABELS)]} />
        <FilterSelect
          name="strength"
          label="Strength"
          defaultValue={filters.strength}
          options={[{ value: "", label: "Any strength" }, ...options(SIGNAL_STRENGTH_LABELS)]}
        />
      </FilterBar>

      {signals.length === 0 ? (
        <EmptyState title={filtered ? "No signals match these filters" : "No signals recorded yet"}>
          {filtered ? "Try clearing the filters." : "Open a company and add a signal with its source URL."}
        </EmptyState>
      ) : (
        <Card>
          <CardBody className="divide-y divide-slate-100">
            {signals.map((s) => (
              <SignalItem key={s.id} signal={s} company={s.company} />
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
