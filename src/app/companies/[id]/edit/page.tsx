import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui";
import { getCompany } from "@/lib/data/companies";
import { toDateInput } from "@/lib/format";
import { deleteCompany, updateCompany } from "../../actions";
import { CompanyForm } from "../../company-form";

export const metadata: Metadata = { title: "Edit company · TenantScout AI" };

export default async function EditCompanyPage({ params }: PageProps<"/companies/[id]/edit">) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${company.name}`}
        back={{ href: `/companies/${id}`, label: company.name }}
        actions={
          <DeleteButton
            action={deleteCompany.bind(null, id)}
            confirmText={`Delete ${company.name}? Its signals, leads and notes will also be deleted.`}
          />
        }
      />
      <CompanyForm
        action={updateCompany.bind(null, id)}
        submitLabel="Save changes"
        cancelHref={`/companies/${id}`}
        initial={{
          name: company.name,
          industry: company.industry,
          description: company.description ?? "",
          website: company.website ?? "",
          currentCity: company.currentCity ?? "",
          headcount: company.headcount?.toString() ?? "",
          currentAreaSqm: company.currentAreaSqm?.toString() ?? "",
          requiredAreaMinSqm: company.requiredAreaMinSqm?.toString() ?? "",
          requiredAreaMaxSqm: company.requiredAreaMaxSqm?.toString() ?? "",
          preferredCities: company.preferredCities.join(", "),
          preferredSubmarkets: company.preferredSubmarkets.join(", "),
          preferredPropertyTypes: company.preferredPropertyTypes,
          maxRentEurSqmMonth: company.maxRentEurSqmMonth?.toFixed(2) ?? "",
          targetMoveDate: toDateInput(company.targetMoveDate),
        }}
      />
    </div>
  );
}
