"use client";

import { useFormStatus } from "react-dom";
import { SubmitButton } from "./form";

function CompactSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-xs text-red-700 hover:underline disabled:opacity-60">
      {pending ? "Removing…" : label}
    </button>
  );
}

// Delete form with a browser confirmation, so records are never removed by a single misclick.
export function DeleteButton({
  action,
  confirmText,
  label = "Delete",
  compact = false,
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {compact ? (
        <CompactSubmit label={label} />
      ) : (
        <SubmitButton variant="danger" pendingText="Deleting…">
          {label}
        </SubmitButton>
      )}
    </form>
  );
}
