"use client";

import { Check, CircleCheck } from "lucide-react";
import { useEventEditor } from "@/components/events/event-editor-context";
import type { AttentionItem } from "@/lib/brief/engine";
import { householdActions } from "@/lib/store/household-store";
import { cn } from "@/lib/utils";

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  const { openEvent } = useEventEditor();

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-ok-soft/60 px-5 py-6">
        <CircleCheck className="size-6 shrink-0 text-ok" strokeWidth={1.75} aria-hidden />
        <p className="text-lg font-medium text-ink">You&apos;re good. Nothing needs your attention.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const high = item.severity === "high";
        return (
          <li
            key={item.id}
            className={cn(
              "rounded-2xl border border-l-4 bg-surface px-5 py-4",
              high ? "border-critical-line border-l-critical" : "border-alert-line border-l-alert",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => item.eventId && openEvent(item.eventId)}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    high ? "text-critical" : "text-alert",
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-[17px] font-medium leading-snug text-ink">{item.title}</p>
                {item.detail && (
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-2">{item.detail}</p>
                )}
              </button>
              {item.noteId && item.eventId && (
                <button
                  type="button"
                  onClick={() => householdActions.setPrepNoteDone(item.eventId!, item.noteId!, true)}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink-2 hover:border-line-strong hover:text-ink"
                >
                  <Check className="size-4" aria-hidden /> Done
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
