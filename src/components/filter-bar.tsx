import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "./ui";

// A plain GET form for list filters: works without JavaScript and keeps
// filters in the URL so they can be bookmarked or shared.

const controlClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200";

export function FilterBar({ children, resetHref, active }: { children: ReactNode; resetHref: string; active: boolean }) {
  return (
    <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass("secondary")}>
          Apply
        </button>
        {active && (
          <Link href={resetHref} className="self-center px-2 text-sm text-slate-500 hover:text-slate-800">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}

export function FilterSearch({ name = "q", defaultValue, placeholder }: { name?: string; defaultValue?: string; placeholder: string }) {
  return (
    <input
      type="search"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${controlClass} sm:w-64`}
    />
  );
}

export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} aria-label={label} className={controlClass}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
