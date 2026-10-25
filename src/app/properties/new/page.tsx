import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { createProperty } from "../actions";
import { EMPTY_PROPERTY, PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "Add property · TenantScout AI" };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add property" back={{ href: "/properties", label: "Properties" }} />
      <PropertyForm action={createProperty} initial={EMPTY_PROPERTY} submitLabel="Add property" cancelHref="/properties" />
    </div>
  );
}
