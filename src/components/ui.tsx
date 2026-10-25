import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Small presentational building blocks shared across pages.

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="text-sm text-slate-500 hover:text-slate-800">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <div className="mt-1 text-sm text-slate-600">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {actions}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-4 py-4 sm:px-5", className)} {...props} />;
}

const badgeTones = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", badgeTones[tone])}>
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
} as const;

export function buttonClass(variant: keyof typeof buttonVariants = "primary") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    buttonVariants[variant],
  );
}

export function LinkButton({
  variant,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonVariants }) {
  return <Link className={cn(buttonClass(variant), className)} {...props} />;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

// Label/value list used on detail pages.
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline-offset-2 hover:underline">
      {children}
    </a>
  );
}
