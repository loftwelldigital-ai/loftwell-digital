"use client";

import { differenceInMinutes, parseISO, startOfDay } from "date-fns";
import { Car } from "lucide-react";
import type { ReactNode } from "react";
import { useEventEditor } from "@/components/events/event-editor-context";
import { layoutLanes } from "@/lib/calendar/layout";
import { MEMBER_COLOR_VALUES } from "@/lib/labels";
import type { FamilyMember, FoldEvent, ID } from "@/lib/types";
import { cn, formatTime, sameDay } from "@/lib/utils";

const HOUR_PX = 64;
const DEFAULT_START = 6;
const DEFAULT_END = 22;

export interface GridColumn {
  key: string;
  header?: ReactNode;
  events: FoldEvent[];
  /** Pre-selected participants when creating an event from this column. */
  memberIds?: ID[];
}

function hourRange(events: FoldEvent[]): [number, number] {
  let start = DEFAULT_START;
  let end = DEFAULT_END;
  for (const e of events) {
    if (e.all_day) continue;
    start = Math.min(start, parseISO(e.start_datetime).getHours());
    const endDate = parseISO(e.end_datetime);
    end = Math.max(end, endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0));
  }
  return [start, Math.min(24, end)];
}

export function EventBlock({
  event,
  memberById,
  compact = false,
  short = false,
  wrap = false,
  perspective,
}: {
  event: FoldEvent;
  memberById: Map<ID, FamilyMember>;
  /** Hide participant names (column already identifies the person). */
  compact?: boolean;
  /** Single line for brief events in the time grid. */
  short?: boolean;
  /** Allow titles to wrap (week view). */
  wrap?: boolean;
  /** Member whose column this is — labels drive-only events as "Drive". */
  perspective?: ID;
}) {
  const people = event.family_members.map((id) => memberById.get(id)).filter((m): m is FamilyMember => Boolean(m));
  const color = people[0] ? MEMBER_COLOR_VALUES[people[0].calendar_color] : { solid: "#8a847b", soft: "#efece5" };
  const needsDriver = event.transportation_required && !event.driver;
  const drivingOnly = perspective !== undefined && event.driver === perspective && !event.family_members.includes(perspective);
  return (
    <div
      className={cn(
        "h-full overflow-hidden rounded-lg border-l-[3px] px-2.5 text-left",
        short ? "py-1" : "py-1.5",
        event.status === "cancelled" && "line-through opacity-50",
        event.status === "tentative" && "border-dashed",
      )}
      style={{ backgroundColor: color.soft, borderColor: color.solid }}
    >
      <p className={cn("text-sm font-semibold leading-tight text-ink", wrap ? "break-words" : "truncate")}>
        {drivingOnly && <span className="font-medium text-ink-2">Drive · </span>}
        {event.title}
        {short && <span className="tabular font-normal text-ink-2"> · {formatTime(event.start_datetime)}</span>}
      </p>
      {!short && (
        <p className={cn("tabular text-xs text-ink-2", wrap ? "break-words" : "truncate")}>
          {event.all_day ? "All day" : formatTime(event.start_datetime)}
          {!compact && people.length > 0 && ` · ${people.map((p) => p.nickname).join(", ")}`}
        </p>
      )}
      {needsDriver && (
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-alert">
          <Car className="size-3" aria-hidden /> Driver needed
        </p>
      )}
    </div>
  );
}

export function TimeGrid({
  day,
  columns,
  memberById,
  now,
}: {
  day: Date;
  columns: GridColumn[];
  memberById: Map<ID, FamilyMember>;
  now: Date | null;
}) {
  const { openEvent, newEvent } = useEventEditor();
  const all = columns.flatMap((c) => c.events);
  const [startHour, endHour] = hourRange(all);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const height = hours.length * HOUR_PX;
  const dayStart = startOfDay(day);
  const showNow = now && sameDay(now, day) && now.getHours() >= startHour && now.getHours() < endHour;
  const nowTop = showNow ? (differenceInMinutes(now!, dayStart) / 60 - startHour) * HOUR_PX : 0;
  const multi = columns.length > 1;
  const hasAllDay = all.some((e) => e.all_day);

  const createAt = (column: GridColumn, offsetY: number) => {
    const hour = Math.min(23, startHour + Math.floor(offsetY / HOUR_PX));
    const at = new Date(dayStart);
    at.setHours(hour - 1, 0, 0, 0); // blankEventDraft starts at the next hour
    newEvent({ family_members: column.memberIds ?? [] }, at);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <div style={{ minWidth: multi ? columns.length * 150 + 64 : undefined }}>
        {(multi || hasAllDay) && (
          <div className="sticky top-0 z-10 flex border-b border-line bg-surface">
            <div className="w-16 shrink-0" />
            {columns.map((c) => (
              <div key={c.key} className="min-w-0 flex-1 border-l border-line px-2 py-2">
                {c.header}
                <div className="mt-1 space-y-1">
                  {c.events
                    .filter((e) => e.all_day)
                    .map((e) => (
                      <button key={e.id} type="button" onClick={() => openEvent(e.id)} className="block h-12 w-full">
                        <EventBlock event={e} memberById={memberById} compact={multi} />
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="relative flex" style={{ height }}>
          <div className="w-16 shrink-0">
            {hours.map((h) => (
              <div key={h} className="tabular relative pr-2 text-right text-xs text-ink-3" style={{ height: HOUR_PX }}>
                <span className="-translate-y-1/2 absolute right-2 top-0 bg-surface px-0.5">
                  {h === startHour ? "" : `${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`}
                </span>
              </div>
            ))}
          </div>
          {columns.map((column) => (
            <div
              key={column.key}
              className="relative min-w-0 flex-1 border-l border-line"
              onClick={(e) => {
                if (e.target === e.currentTarget) createAt(column, e.nativeEvent.offsetY);
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none border-t border-line/70 first:border-t-0"
                  style={{ height: HOUR_PX }}
                />
              ))}
              {layoutLanes(column.events.filter((e) => !e.all_day)).map(({ event, lane, lanes }) => {
                const start = parseISO(event.start_datetime);
                const top = (differenceInMinutes(start, dayStart) / 60 - startHour) * HOUR_PX;
                const minutes = Math.max(differenceInMinutes(parseISO(event.end_datetime), start), 30);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event.id)}
                    className="absolute p-0.5"
                    style={{
                      top,
                      height: (minutes / 60) * HOUR_PX,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    <EventBlock
                      event={event}
                      memberById={memberById}
                      compact={multi}
                      short={minutes < 45}
                      perspective={multi ? column.key : undefined}
                    />
                  </button>
                );
              })}
            </div>
          ))}
          {showNow && (
            <div className="pointer-events-none absolute left-16 right-0 z-10" style={{ top: nowTop }}>
              <div className="relative h-px bg-critical">
                <span className="absolute -left-1 -top-1 size-2 rounded-full bg-critical" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
