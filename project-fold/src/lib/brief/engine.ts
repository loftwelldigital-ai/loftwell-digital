/**
 * Daily Brief engine.
 *
 * Derives the three Home questions from household data using deterministic
 * rules:
 *   1. TODAY            — where people must be, in time order
 *   2. NEEDS ATTENTION  — exceptions that require action
 *   3. TOMORROW         — what to prepare for, not another calendar
 *
 * Every output item is a structured fact with a pre-rendered `text`. A future
 * AI layer can rewrite the facts into natural language without changing the
 * rules that decide what matters.
 */
import { addDays, differenceInCalendarDays, isBefore, parseISO, startOfDay } from "date-fns";
import type { FamilyMember, FoldEvent, ID } from "../types";
import { formatTime, joinNames, numberWord, sameDay } from "../utils";
import { eventInterval, isBusy, needsRide, overlaps, peakConcurrency, transportWindow } from "./transport";

/* ------------------------------------------------------------------ */
/* Output types                                                        */
/* ------------------------------------------------------------------ */

export type TimelineState = "past" | "now" | "upcoming";

export interface TodayItem {
  event: FoldEvent;
  members: FamilyMember[];
  driver: FamilyMember | null;
  needsDriver: boolean;
  state: TimelineState;
}

export type AttentionKind =
  | "transport_conflict"
  | "driver_needed"
  | "early_dismissal"
  | "schedule_conflict"
  | "preparation"
  | "deadline";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: "high" | "medium";
  label: string;
  title: string;
  detail: string | null;
  eventId: ID | null;
  /** Present when the item can be cleared by marking a prep note done. */
  noteId: ID | null;
  sortTime: number;
}

export type TomorrowFactKind =
  | "overlap"
  | "drivers"
  | "driver_needed"
  | "appointment"
  | "dismissal"
  | "early_start"
  | "game"
  | "preparation";

export interface TomorrowFact {
  id: string;
  kind: TomorrowFactKind;
  text: string;
  priority: number;
}

export interface TomorrowBrief {
  date: Date;
  headline: string;
  facts: TomorrowFact[];
  eventCount: number;
}

export interface DailyBrief {
  today: TodayItem[];
  attention: AttentionItem[];
  tomorrow: TomorrowBrief;
}

export const MAX_TOMORROW_FACTS = 6;
const BUSY_GAP_MINUTES = 45;
const DEADLINE_HORIZON_HOURS = 48;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type MemberMap = Map<ID, FamilyMember>;

function active(events: FoldEvent[]): FoldEvent[] {
  return events.filter((e) => e.status !== "cancelled");
}

function byStart(a: FoldEvent, b: FoldEvent): number {
  return a.start_datetime.localeCompare(b.start_datetime);
}

function eventsOn(events: FoldEvent[], day: Date): FoldEvent[] {
  return active(events)
    .filter((e) => sameDay(e.start_datetime, day))
    .sort(byStart);
}

function names(ids: ID[], members: MemberMap): string[] {
  return ids.map((id) => members.get(id)?.nickname).filter((n): n is string => Boolean(n));
}

function who(event: FoldEvent, members: MemberMap): string {
  return joinNames(names(event.family_members, members)) || "Someone";
}

function riders(event: FoldEvent, members: MemberMap): string {
  const ids = event.passengers.length > 0 ? event.passengers : event.family_members;
  return joinNames(names(ids, members)) || "Someone";
}

function availableDrivers(event: FoldEvent, events: FoldEvent[], members: FamilyMember[]): FamilyMember[] {
  const window = transportWindow(event);
  return members.filter(
    (m) => m.can_drive && !event.passengers.includes(m.id) && !isBusy(m.id, window, events, event.id),
  );
}

/** Connected components of events whose intervals overlap. */
function overlapGroups(events: FoldEvent[], interval: (e: FoldEvent) => { start: Date; end: Date }): FoldEvent[][] {
  const groups: FoldEvent[][] = [];
  const seen = new Set<ID>();
  for (const e of events) {
    if (seen.has(e.id)) continue;
    const group: FoldEvent[] = [];
    const queue = [e];
    seen.add(e.id);
    while (queue.length) {
      const cur = queue.shift()!;
      group.push(cur);
      for (const other of events) {
        if (!seen.has(other.id) && overlaps(interval(cur), interval(other))) {
          seen.add(other.id);
          queue.push(other);
        }
      }
    }
    if (group.length > 1) groups.push(group.sort(byStart));
  }
  return groups;
}

function relativeDay(target: Date, now: Date): string {
  const diff = differenceInCalendarDays(target, now);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff < 0) return `${-diff} days ago`;
  return `in ${diff} days`;
}

/* ------------------------------------------------------------------ */
/* TODAY                                                               */
/* ------------------------------------------------------------------ */

export function buildToday(events: FoldEvent[], members: FamilyMember[], now: Date): TodayItem[] {
  const map: MemberMap = new Map(members.map((m) => [m.id, m]));
  return eventsOn(events, now).map((event) => {
    const { start, end } = eventInterval(event);
    const state: TimelineState = end <= now ? "past" : start <= now ? "now" : "upcoming";
    return {
      event,
      members: event.family_members.map((id) => map.get(id)).filter((m): m is FamilyMember => Boolean(m)),
      driver: event.driver ? (map.get(event.driver) ?? null) : null,
      needsDriver: needsRide(event) && !event.driver,
      state,
    };
  });
}

/* ------------------------------------------------------------------ */
/* NEEDS ATTENTION                                                     */
/* ------------------------------------------------------------------ */

export function buildAttention(events: FoldEvent[], members: FamilyMember[], now: Date): AttentionItem[] {
  const map: MemberMap = new Map(members.map((m) => [m.id, m]));
  const items: AttentionItem[] = [];
  const today = eventsOn(events, now);
  const remaining = today.filter((e) => parseISO(e.end_datetime) > now);

  /* --- Transportation: overlapping rides ---------------------------- */
  const rides = remaining.filter(needsRide);
  const handledRides = new Set<ID>();

  for (const group of overlapGroups(rides, transportWindow)) {
    const driverIds = group.map((e) => e.driver).filter((d): d is ID => Boolean(d));
    const doubleBooked = driverIds.find((d, i) => driverIds.indexOf(d) !== i);
    const unassigned = group.filter((e) => !e.driver);
    if (!doubleBooked && unassigned.length === 0) continue; // distinct drivers cover it

    group.forEach((e) => handledRides.add(e.id));
    const lines = group.map(
      (e) =>
        `${riders(e, map)} → ${e.title} ${formatTime(e.start_datetime)} · ${
          e.driver ? (map.get(e.driver)?.nickname ?? "Driver") : "no driver"
        }`,
    );
    const title = doubleBooked
      ? `${map.get(doubleBooked)?.nickname ?? "One driver"} is assigned to overlapping drives.`
      : group.length === 2
        ? `${riders(group[0], map)} and ${riders(group[1], map)} need transportation at overlapping times.`
        : `${numberWord(group.length)} rides overlap and not every ride has a driver.`;
    items.push({
      id: `transport-${group.map((e) => e.id).join("-")}`,
      kind: "transport_conflict",
      severity: "high",
      label: "Transportation conflict",
      title,
      detail: lines.join("\n"),
      eventId: group[0].id,
      noteId: null,
      sortTime: transportWindow(group[0]).start.getTime(),
    });
  }

  /* --- Transportation: driver busy with their own event ------------- */
  for (const ride of rides) {
    if (!ride.driver || handledRides.has(ride.id)) continue;
    const window = transportWindow(ride);
    const clash = remaining.find(
      (e) => e.id !== ride.id && e.family_members.includes(ride.driver!) && overlaps(eventInterval(e), window),
    );
    if (!clash) continue;
    handledRides.add(ride.id);
    const driverName = map.get(ride.driver)?.nickname ?? "The driver";
    items.push({
      id: `driver-busy-${ride.id}`,
      kind: "transport_conflict",
      severity: "high",
      label: "Transportation conflict",
      title: `${driverName} is driving ${riders(ride, map)} to ${ride.title} but has ${clash.title} at ${formatTime(clash.start_datetime)}.`,
      detail: null,
      eventId: ride.id,
      noteId: null,
      sortTime: window.start.getTime(),
    });
  }

  /* --- Transportation: no driver ------------------------------------ */
  for (const ride of rides) {
    if (ride.driver || handledRides.has(ride.id)) continue;
    const free = availableDrivers(ride, active(events), members);
    items.push({
      id: `driver-needed-${ride.id}`,
      kind: "driver_needed",
      severity: "high",
      label: "Driver needed",
      title: `${riders(ride, map)} → ${ride.title} at ${formatTime(ride.start_datetime)}`,
      detail: free.length
        ? `Leaves ${formatTime(transportWindow(ride).start)}. Available: ${joinNames(free.map((m) => m.nickname))}.`
        : `Leaves ${formatTime(transportWindow(ride).start)}. No licensed driver is free.`,
      eventId: ride.id,
      noteId: null,
      sortTime: transportWindow(ride).start.getTime(),
    });
  }

  /* --- Early dismissals --------------------------------------------- */
  for (const e of remaining.filter((e) => e.event_type === "dismissal")) {
    const time = e.dismissal_time ?? e.start_datetime;
    if (parseISO(time) <= now) continue;
    items.push({
      id: `dismissal-${e.id}`,
      kind: "early_dismissal",
      severity: "medium",
      label: "Early dismissal",
      title: `${who(e, map)} must be picked up at ${formatTime(time)}.`,
      detail: e.location || null,
      eventId: e.id,
      noteId: null,
      sortTime: parseISO(time).getTime(),
    });
  }

  /* --- Same person double-booked ------------------------------------ */
  for (const member of members) {
    const theirs = remaining.filter((e) => e.family_members.includes(member.id));
    for (const group of overlapGroups(theirs, eventInterval)) {
      items.push({
        id: `schedule-${member.id}-${group.map((e) => e.id).join("-")}`,
        kind: "schedule_conflict",
        severity: "high",
        label: "Schedule conflict",
        title: `${member.nickname} is booked for ${joinNames(group.map((e) => e.title))} at the same time.`,
        detail: group.map((e) => `${formatTime(e.start_datetime)} ${e.title}`).join("\n"),
        eventId: group[0].id,
        noteId: null,
        sortTime: parseISO(group[0].start_datetime).getTime(),
      });
    }
  }

  /* --- Preparation for today's events ------------------------------- */
  for (const e of remaining) {
    for (const note of e.prep_notes) {
      if (note.done || !note.important || note.due_datetime) continue;
      items.push({
        id: `prep-${note.id}`,
        kind: "preparation",
        severity: "medium",
        label: e.title,
        title: endWithPeriod(note.text),
        detail: `${formatTime(e.start_datetime)}${e.location ? ` · ${e.location}` : ""}`,
        eventId: e.id,
        noteId: note.id,
        sortTime: parseISO(e.start_datetime).getTime(),
      });
    }
  }

  /* --- Deadlines (any event, due soon or overdue) ------------------- */
  const horizon = now.getTime() + DEADLINE_HORIZON_HOURS * 3_600_000;
  for (const e of active(events)) {
    for (const note of e.prep_notes) {
      if (note.done || !note.important || !note.due_datetime) continue;
      const due = parseISO(note.due_datetime);
      if (due.getTime() > horizon) continue;
      const overdue = isBefore(due, now);
      const isSlip = /permission/i.test(note.text);
      items.push({
        id: `deadline-${note.id}`,
        kind: "deadline",
        severity: overdue ? "high" : "medium",
        label: isSlip ? "Permission slip" : "Deadline",
        title: overdue
          ? `${endWithPeriod(note.text).slice(0, -1)} — overdue.`
          : `${note.text} — due ${relativeDay(due, now)} at ${formatTime(due)}.`,
        detail: `${e.title} · ${who(e, map)}`,
        eventId: e.id,
        noteId: note.id,
        sortTime: due.getTime(),
      });
    }
  }

  return items.sort((a, b) => (a.severity === b.severity ? a.sortTime - b.sortTime : a.severity === "high" ? -1 : 1));
}

function endWithPeriod(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/* ------------------------------------------------------------------ */
/* TOMORROW                                                            */
/* ------------------------------------------------------------------ */

function hourLabel(d: Date, roundUp: boolean): { hour: number; text: string } {
  const h = roundUp && (d.getMinutes() > 0 || d.getSeconds() > 0) ? d.getHours() + 1 : d.getHours();
  const hour12 = ((h + 11) % 12) + 1;
  return { hour: h, text: `${hour12}` };
}

function busyWindowText(start: Date, end: Date): string {
  const s = hourLabel(start, false);
  const e = hourLabel(end, true);
  const sMer = s.hour < 12 ? "AM" : "PM";
  const eMer = e.hour % 24 < 12 ? "AM" : "PM";
  return sMer === eMer ? `${s.text}–${e.text} ${eMer}` : `${s.text} ${sMer}–${e.text} ${eMer}`;
}

export function buildTomorrow(events: FoldEvent[], members: FamilyMember[], now: Date): TomorrowBrief {
  const map: MemberMap = new Map(members.map((m) => [m.id, m]));
  const date = addDays(startOfDay(now), 1);
  const list = eventsOn(events, date);
  const facts: TomorrowFact[] = [];

  if (list.length === 0) {
    return { date, headline: "Nothing is scheduled for tomorrow.", facts, eventCount: 0 };
  }

  /* Busy window: chain events separated by short gaps. */
  let best: FoldEvent[] = [];
  let chain: FoldEvent[] = [];
  let chainEnd = 0;
  for (const e of list.filter((e) => !e.all_day)) {
    const s = parseISO(e.start_datetime).getTime();
    if (chain.length && s - chainEnd <= BUSY_GAP_MINUTES * 60_000) {
      chain.push(e);
    } else {
      chain = [e];
    }
    chainEnd = Math.max(chain.length > 1 ? chainEnd : 0, parseISO(e.end_datetime).getTime());
    if (chain.length > best.length) best = [...chain];
  }

  const first = list.find((e) => !e.all_day);
  const earlyStart = first && parseISO(first.start_datetime).getHours() < 8 ? first : null;

  let headline: string;
  if (best.length >= 3) {
    const start = parseISO(best[0].start_datetime);
    const end = new Date(Math.max(...best.map((e) => parseISO(e.end_datetime).getTime())));
    headline = `Tomorrow looks busy from ${busyWindowText(start, end)}.`;
  } else if (list.length <= 2) {
    headline = `Tomorrow is light — ${numberWord(list.length).toLowerCase()} ${list.length === 1 ? "thing" : "things"} scheduled.`;
  } else {
    headline = `Tomorrow is steady — ${numberWord(list.length).toLowerCase()} things scheduled, nothing stacked.`;
  }

  /* Overlapping rides — the overlaps that create logistics. Two unrelated
     appointments at the same time with no shared driver are not news. */
  for (const group of overlapGroups(list.filter((e) => !e.all_day && needsRide(e)), eventInterval)) {
    facts.push({
      id: `overlap-${group.map((e) => e.id).join("-")}`,
      kind: "overlap",
      text: `${joinNames(group.map((e) => shortTitle(e)))} overlap.`,
      priority: 10,
    });
  }

  /* Driver demand. */
  const peak = peakConcurrency(list);
  if (peak.count >= 2 && peak.at) {
    facts.push({
      id: "drivers-peak",
      kind: "drivers",
      text: `${numberWord(peak.count)} drivers will be needed from ${formatTime(peak.at, true)}.`,
      priority: 9,
    });
  }

  for (const ride of list.filter((e) => needsRide(e) && !e.driver)) {
    const free = availableDrivers(ride, active(events), members);
    facts.push({
      id: `driver-needed-${ride.id}`,
      kind: "driver_needed",
      text: `No driver yet for ${riders(ride, map)}'s ${ride.title.toLowerCase()} (${formatTime(ride.start_datetime, true)})${
        free.length ? ` — ${joinNames(free.map((m) => m.nickname))} ${free.length === 1 ? "is" : "are"} free.` : "."
      }`,
      priority: 8,
    });
  }

  for (const e of list.filter((e) => e.event_type === "dismissal")) {
    facts.push({
      id: `dismissal-${e.id}`,
      kind: "dismissal",
      text: `Early dismissal for ${who(e, map)} at ${formatTime(e.dismissal_time ?? e.start_datetime, true)}.`,
      priority: 7,
    });
  }

  const covered = new Set(list.filter((e) => needsRide(e) && !e.driver).map((e) => e.id));
  for (const e of list.filter((e) => (e.event_type === "appointment" || e.event_type === "pet") && !covered.has(e.id))) {
    facts.push({
      id: `appt-${e.id}`,
      kind: "appointment",
      text: `${e.title} at ${formatTime(e.start_datetime, true)} — ${who(e, map)}.`,
      priority: 6,
    });
  }

  if (earlyStart && best[0]?.id !== earlyStart.id) {
    facts.push({
      id: `early-${earlyStart.id}`,
      kind: "early_start",
      text: `Early start: ${earlyStart.title} at ${formatTime(earlyStart.start_datetime, true)}.`,
      priority: 6,
    });
  }

  for (const e of list.filter((e) => e.event_type === "game" || e.event_type === "tournament")) {
    facts.push({
      id: `game-${e.id}`,
      kind: "game",
      text: `${who(e, map)}: ${e.title} at ${formatTime(e.start_datetime, true)}${e.arrival_time ? `, arrive by ${formatTime(e.arrival_time)}` : ""}.`,
      priority: 4,
    });
  }

  for (const e of list) {
    for (const note of e.prep_notes.filter((n) => !n.done && !n.due_datetime)) {
      facts.push({
        id: `prep-${note.id}`,
        kind: "preparation",
        text: `${who(e, map)}: ${endWithPeriod(note.text)}`,
        priority: note.important ? 7 : 3,
      });
    }
  }

  facts.sort((a, b) => b.priority - a.priority);
  return { date, headline, facts: facts.slice(0, MAX_TOMORROW_FACTS), eventCount: list.length };
}

function shortTitle(e: FoldEvent): string {
  // "Hockey Practice" → "Hockey"; keeps non-sport titles intact.
  return e.title.replace(/\s+(Practice|Game|Lesson)(\s*\(.*\))?$/i, "");
}

/* ------------------------------------------------------------------ */

export function buildDailyBrief(events: FoldEvent[], members: FamilyMember[], now: Date): DailyBrief {
  return {
    today: buildToday(events, members, now),
    attention: buildAttention(events, members, now),
    tomorrow: buildTomorrow(events, members, now),
  };
}
