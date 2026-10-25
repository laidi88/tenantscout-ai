import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { createCompany } from "../actions";
import { CompanyForm, EMPTY_COMPANY } from "../company-form";

export const metadata: Metadata = { title: "Add company · TenantScout AI" };

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add company" back={{ href: "/companies", label: "Companies" }} />
      <CompanyForm action={createCompany} initial={EMPTY_COMPANY} submitLabel="Add company" cancelHref="/companies" />
    </div>
  );
}
