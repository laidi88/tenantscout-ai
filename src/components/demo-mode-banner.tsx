import { connection } from "next/server";
import { FlaskConical } from "lucide-react";
import { isDemoMode } from "@/lib/demo/mode";

// Shown on every page while the app runs without a database. Checked at
// request time (not build time) so a deployment with DATABASE_URL never shows it.
export async function DemoModeBanner() {
  await connection();
  if (!isDemoMode()) return null;

  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50">
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-sm text-amber-900 sm:items-center sm:px-6 lg:px-8">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden />
        <span>
          <span className="font-semibold">Demo Mode</span>
          <span className="text-amber-800">
            {" "}
            · No database connected. Showing fictional sample data; changes are kept only until the server restarts.
          </span>
        </span>
      </p>
    </div>
  );
}
