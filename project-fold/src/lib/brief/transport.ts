/**
 * Transportation primitives used by the brief engine.
 *
 * Kept deliberately modular: the "commitment window" model below is the
 * single place to change when travel time, return trips and pickup legs
 * are added (Transportation phase).
 */
import { parseISO, subMinutes } from "date-fns";
import type { FoldEvent, ID } from "../types";

/** Default lead time when an event needs a ride but has no departure time. */
export const DEFAULT_DEPARTURE_LEAD_MINUTES = 30;

export interface Interval {
  start: Date;
  end: Date;
}

/**
 * The window during which a driver is tied up by an event.
 * Current model: from departure until the event ends (conservative — assumes
 * the driver stays or does the return trip).
 */
export function transportWindow(event: FoldEvent): Interval {
  const start = event.departure_time
    ? parseISO(event.departure_time)
    : subMinutes(parseISO(event.start_datetime), DEFAULT_DEPARTURE_LEAD_MINUTES);
  return { start, end: parseISO(event.end_datetime) };
}

export function eventInterval(event: FoldEvent): Interval {
  return { start: parseISO(event.start_datetime), end: parseISO(event.end_datetime) };
}

/** Half-open overlap: touching intervals do not overlap. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function needsRide(event: FoldEvent): boolean {
  return event.transportation_required && event.status !== "cancelled";
}

/** Maximum number of simultaneous rides needed, and when that peak begins. */
export function peakConcurrency(events: FoldEvent[]): { count: number; at: Date | null } {
  const points: Array<{ t: number; delta: number }> = [];
  for (const e of events.filter(needsRide)) {
    const w = transportWindow(e);
    points.push({ t: w.start.getTime(), delta: 1 }, { t: w.end.getTime(), delta: -1 });
  }
  // Ends before starts at the same instant (half-open intervals).
  points.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let current = 0;
  let best = 0;
  let at: Date | null = null;
  for (const p of points) {
    current += p.delta;
    if (current > best) {
      best = current;
      at = new Date(p.t);
    }
  }
  return { count: best, at };
}

/** Is this person busy (driving or attending) at any point in `window`? */
export function isBusy(personId: ID, window: Interval, events: FoldEvent[], ignoreEventId?: ID): boolean {
  return events.some((e) => {
    if (e.id === ignoreEventId || e.status === "cancelled") return false;
    if (e.driver === personId && needsRide(e) && overlaps(transportWindow(e), window)) return true;
    if (e.family_members.includes(personId) && overlaps(eventInterval(e), window)) return true;
    return false;
  });
}
