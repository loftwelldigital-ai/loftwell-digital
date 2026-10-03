"use client";

import { addDays, eachDayOfInterval, format, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useEventEditor } from "@/components/events/event-editor-context";
import { ColorDot, MemberAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingState, PageBody } from "@/components/ui/page";
import { involvesAny } from "@/lib/calendar/layout";
import { useHousehold } from "@/lib/hooks/use-household";
import { useNow } from "@/lib/hooks/use-now";
import type { FoldEvent, ID } from "@/lib/types";
import { cn, sameDay } from "@/lib/utils";
import { EventBlock, TimeGrid } from "./time-grid";

export type CalendarMode = "day" | "week" | "family";
const MODES: Array<{ id: CalendarMode; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "family", label: "Family" },
];

function parseDateParam(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function CalendarView({ initialMode, initialDate }: { initialMode?: string; initialDate?: string }) {
  const { ready, events, members, memberById } = useHousehold();
  const { newEvent, openEvent } = useEventEditor();
  const now = useNow();
  const [mode, setMode] = useState<CalendarMode>(
    MODES.some((m) => m.id === initialMode) ? (initialMode as CalendarMode) : "day",
  );
  const [pickedDate, setPickedDate] = useState<Date | null>(() => parseDateParam(initialDate));
  const [filter, setFilter] = useState<Set<ID>>(new Set());

  const date = pickedDate ?? now;
  const visible = useMemo(
    () => events.filter((e) => involvesAny(e, filter)).sort((a, b) => a.start_datetime.localeCompare(b.start_datetime)),
    [events, filter],
  );

  if (!ready || !date) return <LoadingState />;

  const step = mode === "week" ? 7 : 1;
  const shift = (n: number) => setPickedDate(addDays(date, n * step));
  // Rolling seven days from the selected date: an operations view looks ahead, not back.
  const weekDays = eachDayOfInterval({ start: date, end: addDays(date, 6) });
  const label =
    mode === "week"
      ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], weekDays[0].getMonth() === weekDays[6].getMonth() ? "d, yyyy" : "MMM d, yyyy")}`
      : format(date, "EEEE, MMMM d");

  const toggleMember = (id: ID) =>
    setFilter((f) => {
      const next = new Set(f);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const dayEvents = (d: Date) => visible.filter((e) => sameDay(e.start_datetime, d));
  const familyColumns = (filter.size ? members.filter((m) => filter.has(m.id)) : members).map((m) => ({
    key: m.id,
    memberIds: [m.id],
    header: (
      <div className="flex items-center gap-2">
        <MemberAvatar member={m} size="sm" />
        <span className="truncate text-sm font-semibold">{m.nickname}</span>
      </div>
    ),
    events: events.filter((e) => sameDay(e.start_datetime, date) && involvesAny(e, new Set([m.id]))),
  }));

  return (
    <PageBody>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={() => shift(-1)} aria-label="Previous" className="w-11 px-0">
              <ChevronLeft className="size-5" />
            </Button>
            <Button variant="ghost" onClick={() => shift(1)} aria-label="Next" className="w-11 px-0">
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{label}</h1>
          {!(now && sameDay(now, date)) && (
            <Button onClick={() => setPickedDate(null)} className="h-10">
              Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div role="tablist" aria-label="Calendar view" className="flex rounded-xl border border-line bg-sunken p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                type="button"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "h-10 rounded-lg px-4 text-[15px] font-medium transition-colors",
                  mode === m.id ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => newEvent({ family_members: [...filter] }, date)}>
            <Plus className="size-4" aria-hidden /> Event
          </Button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter by family member">
        <button
          type="button"
          onClick={() => setFilter(new Set())}
          aria-pressed={filter.size === 0}
          className={cn(
            "h-10 rounded-full border px-4 text-sm font-medium",
            filter.size === 0 ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2",
          )}
        >
          Everyone
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleMember(m.id)}
            aria-pressed={filter.has(m.id)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium",
              filter.has(m.id) ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2",
            )}
          >
            <ColorDot color={m.calendar_color} />
            {m.nickname}
          </button>
        ))}
      </div>

      {mode === "day" && (
        <TimeGrid day={date} columns={[{ key: "day", events: dayEvents(date), memberIds: [...filter] }]} memberById={memberById} now={now} />
      )}

      {mode === "family" && <TimeGrid day={date} columns={familyColumns} memberById={memberById} now={now} />}

      {mode === "week" && (
        <div className="grid gap-3 lg:grid-cols-7">
          {weekDays.map((d) => {
            const list = dayEvents(d);
            return (
              <section
                key={d.toISOString()}
                className={cn(
                  "flex min-w-0 flex-col rounded-2xl border bg-surface p-3 lg:min-h-80",
                  isToday(d) ? "border-accent/50 ring-1 ring-accent/20" : "border-line",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPickedDate(d);
                    setMode("day");
                  }}
                  className="mb-3 flex items-baseline gap-2 text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{format(d, "EEE")}</span>
                  <span className={cn("text-xl font-semibold", isToday(d) ? "text-accent" : "text-ink")}>
                    {format(d, "d")}
                  </span>
                </button>
                <div className="flex flex-col gap-1.5">
                  {list.length === 0 && <p className="text-sm text-ink-3">—</p>}
                  {list.map((e: FoldEvent) => (
                    <button key={e.id} type="button" onClick={() => openEvent(e.id)} className="min-h-12">
                      <EventBlock event={e} memberById={memberById} wrap />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageBody>
  );
}
