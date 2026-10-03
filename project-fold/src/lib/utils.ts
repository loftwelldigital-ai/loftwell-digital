import { format, isSameDay, parseISO } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** UUID v4 — matches Supabase uuid primary keys. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** "9:00 AM", or "9 AM" when compact and on the hour. */
export function formatTime(value: string | Date, compact = false): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  if (compact && d.getMinutes() === 0) return format(d, "h a");
  return format(d, "h:mm a");
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** yyyy-MM-dd in local time. */
export function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** HH:mm in local time, for <input type="time">. */
export function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  return format(parseISO(iso), "HH:mm");
}

/** Combine a yyyy-MM-dd and HH:mm (local) into an ISO string. */
export function combineDateTime(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

export function sameDay(a: string | Date, b: Date): boolean {
  return isSameDay(typeof a === "string" ? parseISO(a) : a, b);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
