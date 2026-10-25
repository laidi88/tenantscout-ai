"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form";
import { Card, CardBody, LinkButton } from "@/components/ui";
import { options, PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/labels";
import type { FormState } from "@/lib/validation";

export type PropertyFormValues = {
  name: string;
  addressLine: string;
  city: string;
  submarket: string;
  propertyType: string;
  totalAreaSqm: string;
  minDivisibleAreaSqm: string;
  askingRentEurSqmMonth: string;
  availableFrom: string;
  features: string;
  description: string;
  status: string;
};

export const EMPTY_PROPERTY: PropertyFormValues = {
  name: "",
  addressLine: "",
  city: "",
  submarket: "",
  propertyType: "",
  totalAreaSqm: "",
  minDivisibleAreaSqm: "",
  askingRentEurSqmMonth: "",
  availableFrom: "",
  features: "",
  description: "",
  status: "AVAILABLE",
};

export function PropertyForm({
  action,
  initial,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: PropertyFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} noValidate>
      <Card>
        <CardBody className="space-y-6">
          <FormMessage state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Property name" required state={state} defaultValue={initial.name} className="sm:col-span-2" />
            <TextField name="addressLine" label="Address" required state={state} defaultValue={initial.addressLine} className="sm:col-span-2" />
            <TextField name="city" label="City" required state={state} defaultValue={initial.city} />
            <TextField name="submarket" label="Submarket / district" state={state} defaultValue={initial.submarket} />
            <SelectField
              name="propertyType"
              label="Property type"
              required
              state={state}
              defaultValue={initial.propertyType}
              placeholder="Choose…"
              options={options(PROPERTY_TYPE_LABELS)}
            />
            <SelectField
              name="status"
              label="Status"
              required
              state={state}
              defaultValue={initial.status}
              options={options(PROPERTY_STATUS_LABELS)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="totalAreaSqm" label="Total area (m²)" type="number" required state={state} defaultValue={initial.totalAreaSqm} />
            <TextField
              name="minDivisibleAreaSqm"
              label="Smallest divisible unit (m²)"
              type="number"
              state={state}
              defaultValue={initial.minDivisibleAreaSqm}
              hint="Leave empty if the space cannot be split."
            />
            <TextField
              name="askingRentEurSqmMonth"
              label="Asking rent (€/m²/month)"
              type="number"
              step="0.01"
              state={state}
              defaultValue={initial.askingRentEurSqmMonth}
            />
            <TextField
              name="availableFrom"
              label="Available from"
              type="date"
              state={state}
              defaultValue={initial.availableFrom}
              hint="Leave empty if available now."
            />
          </div>

          <TextField
            name="features"
            label="Features"
            state={state}
            defaultValue={initial.features}
            placeholder="e.g. Parking, Fitted out, Rooftop terrace"
            hint="Separate features with commas."
          />
          <TextAreaField name="description" label="Description" state={state} defaultValue={initial.description} />
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
