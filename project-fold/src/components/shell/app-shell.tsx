"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EventEditorProvider } from "@/components/events/event-editor-context";
import { useHousehold } from "@/lib/hooks/use-household";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3">
      <span className="grid size-8 place-items-center rounded-lg bg-ink text-[13px] font-bold tracking-tight text-surface">
        F
      </span>
      <span className="text-[15px] font-semibold tracking-[0.18em] text-ink">FOLD</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
              active ? "bg-surface text-ink shadow-card ring-1 ring-line" : "text-ink-2 hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon className={cn("size-[19px]", active ? "text-accent" : "text-ink-3")} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { household } = useHousehold();
  const pathname = usePathname();
  const current = NAV_ITEMS.find((n) => isActive(pathname, n.href));

  return (
    <EventEditorProvider>
      <div className="flex min-h-dvh">
        {/* Sidebar — tablet landscape and up */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-canvas px-3 py-6 lg:flex">
          <Wordmark />
          <div className="mt-8 flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <p className="px-3 text-xs text-ink-3">{household?.name ?? " "}</p>
        </aside>

        {/* Top bar — phones and portrait tablets */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
            <Wordmark />
            <span className="text-sm font-medium text-ink-2">{current?.label}</span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-12 items-center justify-center rounded-xl text-ink hover:bg-sunken"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
          </header>

          {open && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-canvas px-3 py-4 shadow-raised">
                <div className="mb-6 flex items-center justify-between">
                  <Wordmark />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-12 items-center justify-center rounded-xl hover:bg-sunken"
                    aria-label="Close menu"
                  >
                    <X className="size-6" />
                  </button>
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </EventEditorProvider>
  );
}
