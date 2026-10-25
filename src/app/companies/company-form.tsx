"use client";

import { useActionState } from "react";
import { CheckboxGroupField, FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/form";
import { Card, CardBody, LinkButton } from "@/components/ui";
import { options, PROPERTY_TYPE_LABELS } from "@/lib/labels";
import type { FormState } from "@/lib/validation";

export type CompanyFormValues = {
  name: string;
  industry: string;
  description: string;
  website: string;
  currentCity: string;
  headcount: string;
  currentAreaSqm: string;
  requiredAreaMinSqm: string;
  requiredAreaMaxSqm: string;
  preferredCities: string;
  preferredSubmarkets: string;
  preferredPropertyTypes: string[];
  maxRentEurSqmMonth: string;
  targetMoveDate: string;
};

export const EMPTY_COMPANY: CompanyFormValues = {
  name: "",
  industry: "",
  description: "",
  website: "",
  currentCity: "",
  headcount: "",
  currentAreaSqm: "",
  requiredAreaMinSqm: "",
  requiredAreaMaxSqm: "",
  preferredCities: "",
  preferredSubmarkets: "",
  preferredPropertyTypes: [],
  maxRentEurSqmMonth: "",
  targetMoveDate: "",
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function CompanyForm({
  action,
  initial,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: CompanyFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} noValidate>
      <Card>
        <CardBody className="space-y-8">
          <FormMessage state={state} />
          <Section title="Profile">
            <TextField name="name" label="Company name" required state={state} defaultValue={initial.name} />
            <TextField name="industry" label="Industry" required state={state} defaultValue={initial.industry} />
            <TextField
              name="website"
              label="Website"
              type="url"
              state={state}
              defaultValue={initial.website}
              placeholder="https://example.com"
            />
            <TextField name="currentCity" label="Current city" state={state} defaultValue={initial.currentCity} />
            <TextField name="headcount" label="Headcount" type="number" state={state} defaultValue={initial.headcount} />
            <TextField name="currentAreaSqm" label="Current space (m²)" type="number" state={state} defaultValue={initial.currentAreaSqm} />
            <TextAreaField name="description" label="Business profile" state={state} defaultValue={initial.description} className="sm:col-span-2" />
          </Section>

          <Section title="Space requirement" description="Used to score how well each property fits. Leave blank if unknown.">
            <TextField name="requiredAreaMinSqm" label="Minimum area (m²)" type="number" state={state} defaultValue={initial.requiredAreaMinSqm} />
            <TextField name="requiredAreaMaxSqm" label="Maximum area (m²)" type="number" state={state} defaultValue={initial.requiredAreaMaxSqm} />
            <TextField
              name="preferredCities"
              label="Preferred cities"
              state={state}
              defaultValue={initial.preferredCities}
              hint="Separate with commas."
            />
            <TextField
              name="preferredSubmarkets"
              label="Preferred submarkets"
              state={state}
              defaultValue={initial.preferredSubmarkets}
              hint="Separate with commas."
            />
            <CheckboxGroupField
              name="preferredPropertyTypes"
              label="Preferred property types"
              state={state}
              defaultValue={initial.preferredPropertyTypes}
              options={options(PROPERTY_TYPE_LABELS)}
              className="sm:col-span-2"
            />
            <TextField
              name="maxRentEurSqmMonth"
              label="Maximum rent (€/m²/month)"
              type="number"
              step="0.01"
              state={state}
              defaultValue={initial.maxRentEurSqmMonth}
            />
            <TextField name="targetMoveDate" label="Target move date" type="date" state={state} defaultValue={initial.targetMoveDate} />
          </Section>
        </CardBody>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          <LinkButton href={cancelHref} variant="secondary">
            Cancel
          </LinkButton>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
