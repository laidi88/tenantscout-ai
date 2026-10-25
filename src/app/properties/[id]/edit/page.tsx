import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui";
import { getProperty } from "@/lib/data/properties";
import { toDateInput } from "@/lib/format";
import { deleteProperty, updateProperty } from "../../actions";
import { PropertyForm } from "../../property-form";

export const metadata: Metadata = { title: "Edit property · TenantScout AI" };

export default async function EditPropertyPage({ params }: PageProps<"/properties/[id]/edit">) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${property.name}`}
        back={{ href: `/properties/${id}`, label: property.name }}
        actions={
          <DeleteButton
            action={deleteProperty.bind(null, id)}
            confirmText={`Delete ${property.name}? Its leads and notes will also be deleted. To keep them, set the status to Archived instead.`}
          />
        }
      />
      <PropertyForm
        action={updateProperty.bind(null, id)}
        submitLabel="Save changes"
        cancelHref={`/properties/${id}`}
        initial={{
          name: property.name,
          addressLine: property.addressLine,
          city: property.city,
          submarket: property.submarket ?? "",
          propertyType: property.propertyType,
          totalAreaSqm: String(property.totalAreaSqm),
          minDivisibleAreaSqm: property.minDivisibleAreaSqm?.toString() ?? "",
          askingRentEurSqmMonth: property.askingRentEurSqmMonth?.toFixed(2) ?? "",
          availableFrom: toDateInput(property.availableFrom),
          features: property.features.join(", "),
          description: property.description ?? "",
          status: property.status,
        }}
      />
    </div>
  );
}
