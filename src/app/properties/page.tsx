import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PropertyStatusBadge } from "@/components/badges";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { PropertyStatus, PropertyType } from "@/generated/prisma/enums";
import { listProperties } from "@/lib/data/properties";
import { formatAreaRange, formatDate, formatRent } from "@/lib/format";
import { options, PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { enumParam, stringParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Properties · TenantScout AI" };

const STATUS_FILTERS = ["ACTIVE", "ALL", ...Object.values(PropertyStatus)] as const;

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const sp = await searchParams;
  const filters = {
    q: stringParam(sp, "q"),
    type: enumParam(sp, "type", Object.values(PropertyType)),
    status: enumParam(sp, "status", STATUS_FILTERS),
  };
  const properties = await listProperties(filters);
  const filtered = Boolean(filters.q || filters.type || filters.status);

  return (
    <>
      <PageHeader
        title="Properties"
        description="Vacant and upcoming commercial spaces available to let."
        actions={
          <LinkButton href="/properties/new">
            <Plus className="h-4 w-4" aria-hidden /> Add property
          </LinkButton>
        }
      />

      <FilterBar resetHref="/properties" active={filtered}>
        <FilterSearch defaultValue={filters.q} placeholder="Search name, address or city" />
        <FilterSelect name="type" label="Property type" defaultValue={filters.type} options={[{ value: "", label: "All types" }, ...options(PROPERTY_TYPE_LABELS)]} />
        <FilterSelect
          name="status"
          label="Status"
          defaultValue={filters.status}
          options={[
            { value: "", label: "All except archived" },
            { value: "ALL", label: "All statuses" },
            ...options(PROPERTY_STATUS_LABELS),
          ]}
        />
      </FilterBar>

      {properties.length === 0 ? (
        <EmptyState title={filtered ? "No properties match these filters" : "No properties yet"}>
          {filtered ? "Try clearing the filters." : "Add your first vacant property to start matching tenants."}
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          {/* Table on larger screens */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Asking rent</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="font-medium text-slate-900 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.submarket ? `${p.submarket}, ` : ""}
                      {p.city}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{PROPERTY_TYPE_LABELS[p.propertyType]}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatAreaRange(p.minDivisibleAreaSqm, p.totalAreaSqm)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatRent(p.askingRentEurSqmMonth?.toNumber())}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">{p.availableFrom ? formatDate(p.availableFrom) : "Now"}</td>
                  <td className="px-4 py-3">
                    <PropertyStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{p._count.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards on phones */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {properties.map((p) => (
              <li key={p.id}>
                <Link href={`/properties/${p.id}`} className="block px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-900">{p.name}</span>
                    <PropertyStatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {PROPERTY_TYPE_LABELS[p.propertyType]} · {p.submarket ? `${p.submarket}, ` : ""}
                    {p.city}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatAreaRange(p.minDivisibleAreaSqm, p.totalAreaSqm)} · {formatRent(p.askingRentEurSqmMonth?.toNumber())}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
