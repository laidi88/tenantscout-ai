"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form";
import { options, SIGNAL_STRENGTH_LABELS, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import type { FormState } from "@/lib/validation";

export function SignalForm({
  action,
  today,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  today: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="type"
          label="Signal type"
          required
          state={state}
          placeholder="Choose…"
          options={options(SIGNAL_TYPE_LABELS)}
        />
        <SelectField name="strength" label="Strength" required state={state} defaultValue="MEDIUM" options={options(SIGNAL_STRENGTH_LABELS)} />
        <TextField name="title" label="Headline" required state={state} className="sm:col-span-2" placeholder="e.g. Announces 120 new hires in Lindenfeld" />
        <TextField
          name="sourceUrl"
          label="Source URL"
          type="url"
          required
          state={state}
          placeholder="https://"
          hint="Link to the public article, filing or job post."
        />
        <TextField name="sourceName" label="Source name" state={state} placeholder="e.g. City Business Journal" />
        <TextField name="observedAt" label="Date observed" type="date" required state={state} defaultValue={today} />
        <TextAreaField name="summary" label="Summary" rows={2} state={state} className="sm:col-span-2" />
      </div>
      <div className="flex justify-end">
        <SubmitButton>Add signal</SubmitButton>
      </div>
    </form>
  );
}
