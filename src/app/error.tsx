"use client";

import { buttonClass } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">
        This page could not be loaded. If this keeps happening, check that the database is reachable and that
        DATABASE_URL is set.
      </p>
      <button type="button" onClick={reset} className={`${buttonClass("secondary")} mt-4`}>
        Try again
      </button>
    </div>
  );
}
