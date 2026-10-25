// Temporary home page for stage 1. The dashboard replaces it in stage 2.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          Demo data only
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">TenantScout AI</h1>
        <p className="mt-2 text-slate-600">
          Commercial real estate tenant prospecting. Match tenant companies with vacant properties
          and prioritise leads with transparent, explainable scores.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          The application is being set up. Properties, companies, signals and leads will appear here
          in the next stage.
        </p>
      </div>
    </main>
  );
}
