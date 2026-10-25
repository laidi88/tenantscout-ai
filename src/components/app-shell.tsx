"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Building2, Gauge, Handshake, Menu, Radar, Users, X } from "lucide-react";
import { cn } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/leads", label: "Leads", icon: Handshake },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/companies", label: "Companies", icon: Users },
  { href: "/signals", label: "Signals", icon: Radar },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// The current path is only known at request time, so the highlighted nav
// streams in; the prerendered shell shows the same links without highlighting.
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavList pathname="" onNavigate={onNavigate} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  );
}

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            isActive(pathname, href) ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-slate-950">TS</span>
      <span className="font-semibold tracking-tight">TenantScout AI</span>
    </Link>
  );
}

function DemoNotice() {
  return (
    <p className="rounded-lg bg-slate-800/70 px-3 py-2 text-xs leading-relaxed text-slate-300">
      <span className="font-semibold text-amber-300">Demo data only.</span> All companies, properties and signals are
      fictional. Signals are recorded manually.
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-6 bg-slate-900 px-4 py-5 lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <DemoNotice />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-3 lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-200 hover:bg-slate-800"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 bg-slate-900 px-4 py-5">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-200 hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-auto">
                <DemoNotice />
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
