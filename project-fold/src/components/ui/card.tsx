import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)} {...props} />;
}

export function SectionLabel({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-3", className)}
      {...props}
    />
  );
}
