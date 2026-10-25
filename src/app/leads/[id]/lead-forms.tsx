"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form";
import { LEAD_STATUS_LABELS, options } from "@/lib/labels";
import type { FormState } from "@/lib/validation";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function LeadUpdateForm({
  action,
  initial,
}: {
  action: Action;
  initial: { status: string; followUpDate: string; ownerName: string };
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormMessage state={state} />
      <SelectField name="status" label="Status" required state={state} defaultValue={initial.status} options={options(LEAD_STATUS_LABELS)} />
      <TextField name="followUpDate" label="Follow-up date" type="date" state={state} defaultValue={initial.followUpDate} />
      <TextField name="ownerName" label="Owner" state={state} defaultValue={initial.ownerName} placeholder="Who is working this lead?" />
      <div className="flex justify-end">
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}

export function NoteForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a note is saved.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-2">
      <TextAreaField name="body" label="Add a note" rows={3} state={state} />
      {!state.ok && state.message && !state.errors?.body && <FormMessage state={state} />}
      <div className="flex justify-end">
        <SubmitButton pendingText="Adding…">Add note</SubmitButton>
      </div>
    </form>
  );
}
