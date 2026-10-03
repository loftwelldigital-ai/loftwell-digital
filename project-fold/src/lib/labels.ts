import type { EventStatus, EventType, MemberColor, MemberRole, SchoolLevel } from "./types";

export const ROLE_LABELS: Record<MemberRole, string> = {
  parent_admin: "Parent / Admin",
  adult: "Adult",
  teen: "Teen",
  child: "Child",
};

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  none: "Not in school",
  elementary: "Elementary",
  middle_school: "Middle School",
  high_school: "High School",
  college: "College",
  other: "Other",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  appointment: "Appointment",
  practice: "Practice",
  game: "Game",
  tournament: "Tournament",
  school: "School",
  dismissal: "Dismissal",
  business: "Business",
  pet: "Pet",
  pickup: "Pickup",
  dropoff: "Dropoff",
  meeting: "Meeting",
  other: "Other",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Scheduled",
  tentative: "Tentative",
  cancelled: "Cancelled",
};

/** Muted, executive palette. Each color has a strong tone and a soft wash. */
export const MEMBER_COLOR_VALUES: Record<MemberColor, { solid: string; soft: string; label: string }> = {
  slate: { solid: "#4A5A6A", soft: "#E6EAEE", label: "Slate" },
  sage: { solid: "#5E7461", soft: "#E5ECE4", label: "Sage" },
  clay: { solid: "#9A6450", soft: "#F2E6E0", label: "Clay" },
  ochre: { solid: "#9C7A35", soft: "#F3ECDC", label: "Ochre" },
  plum: { solid: "#6E5470", soft: "#EDE5EC", label: "Plum" },
  teal: { solid: "#3F6E6C", soft: "#E1ECEB", label: "Teal" },
  rust: { solid: "#93503A", soft: "#F2E3DC", label: "Rust" },
  olive: { solid: "#6A6B3E", soft: "#ECECDF", label: "Olive" },
  navy: { solid: "#33445E", soft: "#E2E6EE", label: "Navy" },
  stone: { solid: "#77706A", soft: "#ECEAE7", label: "Stone" },
  rose: { solid: "#8E5A63", soft: "#F1E4E6", label: "Rose" },
  moss: { solid: "#53643A", soft: "#E7EBDD", label: "Moss" },
};
