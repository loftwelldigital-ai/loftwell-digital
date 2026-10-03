"use client";

import { Car, MapPin } from "lucide-react";
import { MemberTag } from "@/components/ui/avatar";
import { useEventEditor } from "@/components/events/event-editor-context";
import type { TodayItem } from "@/lib/brief/engine";
import { transportWindow } from "@/lib/brief/transport";
import { MEMBER_COLOR_VALUES } from "@/lib/labels";
import { cn, formatTime } from "@/lib/utils";

function TransportLine({ item }: { item: TodayItem }) {
  const { event, driver, needsDriver } = item;
  if (!event.transportation_required) return null;
  const leaves = formatTime(transportWindow(event).start);
  if (needsDriver) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-alert">
        <Car className="size-4" strokeWidth={1.75} aria-hidden />
        Driver needed · leaves {leaves}
      </p>
    );
  }
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-3">
      <Car className="size-4" strokeWidth={1.75} aria-hidden />
      {driver?.nickname} drives · leaves {leaves}
    </p>
  );
}

export function TodayTimeline({ items }: { items: TodayItem[] }) {
  const { openEvent } = useEventEditor();

  if (items.length === 0) {
    return <p className="py-6 text-lg text-ink-2">Nothing scheduled. Nobody needs to be anywhere today.</p>;
  }

  return (
    <ol className="relative">
      {items.map((item, index) => {
        const { event, members, state } = item;
        const color = members[0] ? MEMBER_COLOR_VALUES[members[0].calendar_color].solid : "var(--color-ink-3)";
        const last = index === items.length - 1;
        return (
          <li key={event.id} className={cn("relative", state === "past" && "opacity-45")}>
            <button
              type="button"
              onClick={() => openEvent(event.id)}
              className="group grid w-full grid-cols-[5.5rem_1.5rem_1fr] items-start py-4 text-left md:grid-cols-[6.5rem_2rem_1fr]"
            >
              <span className="tabular pt-0.5 text-right text-lg font-semibold leading-tight text-ink md:text-xl">
                {event.all_day ? "All day" : formatTime(event.start_datetime)}
              </span>
              <span className="relative flex h-full justify-center" aria-hidden>
                {!last && <span className="absolute top-5 -bottom-6 w-px bg-line" />}
                <span
                  className={cn("relative mt-2 size-3 rounded-full ring-4 ring-surface", state === "now" && "size-3.5")}
                  style={{ backgroundColor: color }}
                />
              </span>
              <span className="min-w-0 rounded-xl pb-1 pl-1 transition-colors group-hover:bg-sunken/50">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-lg font-semibold leading-tight text-ink md:text-xl">{event.title}</span>
                  {state === "now" && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                      Now
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
                  {members.map((m) => (
                    <MemberTag key={m.id} member={m} />
                  ))}
                  {event.location && (
                    <span className="inline-flex min-w-0 items-center gap-1 text-ink-3">
                      <MapPin className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                </span>
                <TransportLine item={item} />
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
