import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Not found</h1>
      <p className="mt-2 text-sm text-slate-600">This record does not exist or has been deleted.</p>
      <LinkButton href="/" variant="secondary" className="mt-4">
        Back to dashboard
      </LinkButton>
    </div>
  );
}
