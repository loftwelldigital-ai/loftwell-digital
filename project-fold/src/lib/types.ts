/**
 * Core domain types for PROJECT FOLD.
 *
 * Persisted records use snake_case field names so they map 1:1 onto future
 * Supabase/Postgres columns. Every household-owned record carries household_id.
 * Datetimes are ISO-8601 strings.
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string; // yyyy-MM-dd

export interface Household {
  id: ID;
  name: string;
  timezone: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Family                                                              */
/* ------------------------------------------------------------------ */

export const MEMBER_ROLES = ["parent_admin", "adult", "teen", "child"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const SCHOOL_LEVELS = [
  "none",
  "elementary",
  "middle_school",
  "high_school",
  "college",
  "other",
] as const;
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const MEMBER_COLORS = [
  "slate",
  "sage",
  "clay",
  "ochre",
  "plum",
  "teal",
  "rust",
  "olive",
  "navy",
  "stone",
  "rose",
  "moss",
] as const;
export type MemberColor = (typeof MEMBER_COLORS)[number];

export interface FamilyMember {
  id: ID;
  household_id: ID;
  full_name: string;
  nickname: string;
  avatar_url: string | null;
  role: MemberRole;
  birth_date: ISODate | null;
  school_level: SchoolLevel;
  school: string | null;
  email: string | null;
  phone: string | null;
  can_drive: boolean;
  calendar_color: MemberColor;
  sports: string[];
  notes: string;
  sort_order: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const EVENT_TYPES = [
  "appointment",
  "practice",
  "game",
  "tournament",
  "school",
  "dismissal",
  "business",
  "pet",
  "pickup",
  "dropoff",
  "meeting",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_SOURCES = [
  "manual",
  "google_calendar",
  "ics_import",
  "csv_import",
  "inbox",
  "crossbar",
  "teamreach",
  "sportsengine",
] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const EVENT_STATUSES = ["scheduled", "tentative", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventReminder {
  id: ID;
  minutes_before: number;
}

export interface EventAttachment {
  id: ID;
  name: string;
  url: string | null;
  document_id: ID | null;
}

/**
 * Something that must happen before an event: "Bring health paperwork",
 * "Return signed permission slip". Important, undone notes surface in
 * Needs Attention. A note with its own due_datetime surfaces as that
 * deadline approaches even if the event itself is further out.
 */
export interface PrepNote {
  id: ID;
  text: string;
  important: boolean;
  due_datetime: ISODateTime | null;
  done: boolean;
}

export interface FoldEvent {
  id: ID;
  household_id: ID;
  title: string;
  description: string;
  event_type: EventType;
  start_datetime: ISODateTime;
  end_datetime: ISODateTime;
  all_day: boolean;
  location: string;
  /** Family member ids the event is about / who must be there. */
  family_members: ID[];
  source: EventSource;
  sport_team: string | null;
  /** When an early/special school release happens. */
  dismissal_time: ISODateTime | null;
  /** When participants must arrive (e.g. warmups before a game). */
  arrival_time: ISODateTime | null;
  /** When the car must leave home. */
  departure_time: ISODateTime | null;
  /** Whether someone has to drive participants to this event. */
  transportation_required: boolean;
  driver: ID | null;
  passengers: ID[];
  reminders: EventReminder[];
  prep_notes: PrepNote[];
  attachments: EventAttachment[];
  external_calendar_id: string | null;
  status: EventStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Shape used by editors before an id/timestamps exist. */
export type EventDraft = Omit<FoldEvent, "id" | "household_id" | "created_at" | "updated_at"> & {
  id?: ID;
};

export type MemberDraft = Omit<FamilyMember, "id" | "household_id" | "created_at" | "updated_at" | "sort_order"> & {
  id?: ID;
};
