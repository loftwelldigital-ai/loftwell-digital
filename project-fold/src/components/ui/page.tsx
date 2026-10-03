import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-base text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 md:px-10 md:py-10", className)}>{children}</div>;
}

export function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-ink-3" role="status">
      <span className="text-sm tracking-wide">Loading household…</span>
    </div>
  );
}
