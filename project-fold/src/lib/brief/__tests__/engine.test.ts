import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { createSeed } from "../../mock/seed";
import type { FoldEvent } from "../../types";
import { buildAttention, buildDailyBrief, buildToday, buildTomorrow } from "../engine";
import { peakConcurrency, transportWindow } from "../transport";

// A fixed morning so "remaining today" includes the whole demo schedule.
const NOW = new Date(2026, 9, 5, 7, 30);

function seed() {
  return createSeed(NOW);
}

function byTitle(events: FoldEvent[], title: string, day = 0): FoldEvent {
  const target = addDays(NOW, day).toDateString();
  const e = events.find((x) => x.title === title && new Date(x.start_datetime).toDateString() === target);
  if (!e) throw new Error(`missing ${title}`);
  return e;
}

describe("Today", () => {
  it("lists today's events chronologically", () => {
    const { events, members } = seed();
    const today = buildToday(events, members, NOW);
    expect(today.map((t) => t.event.title)).toEqual([
      "Business Meeting",
      "Puppy Pickup",
      "Early Dismissal",
      "Soccer Practice",
      "Hockey Practice",
      "Vet Appointment",
    ]);
    expect(today.find((t) => t.event.title === "Hockey Practice")?.needsDriver).toBe(true);
  });

  it("excludes cancelled events and marks past ones", () => {
    const { events, members } = seed();
    const meeting = byTitle(events, "Business Meeting");
    meeting.status = "cancelled";
    const noon = new Date(2026, 9, 5, 12, 0);
    const today = buildToday(events, members, noon);
    expect(today.some((t) => t.event.id === meeting.id)).toBe(false);
    expect(today.find((t) => t.event.title === "Puppy Pickup")?.state).toBe("past");
  });
});

describe("Needs Attention", () => {
  it("flags the overlapping soccer/hockey rides as a transportation conflict", () => {
    const { events, members } = seed();
    const items = buildAttention(events, members, NOW);
    const conflict = items.find((i) => i.kind === "transport_conflict");
    expect(conflict?.title).toBe("Jensen and Joren need transportation at overlapping times.");
    // The unassigned hockey ride is covered by the conflict, not repeated.
    expect(items.some((i) => i.kind === "driver_needed")).toBe(false);
  });

  it("surfaces dismissal, preparation and the permission slip deadline", () => {
    const { events, members } = seed();
    const kinds = buildAttention(events, members, NOW).map((i) => i.kind);
    expect(kinds).toContain("early_dismissal");
    expect(kinds).toContain("preparation");
    expect(kinds).toContain("deadline");
  });

  it("flags the same driver assigned to overlapping rides", () => {
    const { events, members } = seed();
    const mom = members.find((m) => m.nickname === "Mom")!;
    byTitle(events, "Hockey Practice").driver = mom.id;
    const conflict = buildAttention(events, members, NOW).find((i) => i.kind === "transport_conflict");
    expect(conflict?.title).toBe("Mom is assigned to overlapping drives.");
  });

  it("reports DRIVER NEEDED for a lone unassigned ride and suggests free drivers", () => {
    const { events, members } = seed();
    const dad = members.find((m) => m.nickname === "Dad")!;
    byTitle(events, "Hockey Practice").driver = dad.id;
    byTitle(events, "Early Dismissal").driver = null;
    const item = buildAttention(events, members, NOW).find((i) => i.kind === "driver_needed");
    expect(item?.title).toContain("Ronan → Early Dismissal");
    expect(item?.detail).toContain("Available:");
  });

  it("is empty when nothing needs attention", () => {
    const { members } = seed();
    expect(buildAttention([], members, NOW)).toEqual([]);
  });

  it("drops a prep item once it is marked done", () => {
    const { events, members } = seed();
    const pickup = byTitle(events, "Puppy Pickup");
    pickup.prep_notes[0].done = true;
    const items = buildAttention(events, members, NOW);
    expect(items.some((i) => i.noteId === pickup.prep_notes[0].id)).toBe(false);
  });
});

describe("Tomorrow", () => {
  it("summarizes instead of listing", () => {
    const { events, members } = seed();
    const t = buildTomorrow(events, members, NOW);
    expect(t.headline).toBe("Tomorrow looks busy from 3–7 PM.");
    const texts = t.facts.map((f) => f.text);
    expect(texts).toContain("Soccer and Hockey overlap.");
    expect(texts.some((x) => x.includes("Dental Appointment and"))).toBe(false);
    expect(texts).toContain("Two drivers will be needed from 3:45 PM.");
    expect(texts.some((x) => x.startsWith("Dental Appointment at 10 AM"))).toBe(true);
    expect(texts.some((x) => x.startsWith("No driver yet for Ari's piano lesson"))).toBe(true);
    expect(texts.some((x) => x.startsWith("Piano Lesson at"))).toBe(false); // already covered by the driver fact
    expect(t.facts.length).toBeLessThanOrEqual(6);
  });

  it("says so when tomorrow is empty", () => {
    const { members } = seed();
    expect(buildTomorrow([], members, NOW).headline).toBe("Nothing is scheduled for tomorrow.");
  });
});

describe("Transport primitives", () => {
  it("defaults departure to 30 minutes before start", () => {
    const { events } = seed();
    const e = { ...byTitle(events, "Hockey Practice"), departure_time: null };
    expect(transportWindow(e).start.getTime()).toBe(new Date(e.start_datetime).getTime() - 30 * 60_000);
  });

  it("computes peak concurrent rides", () => {
    const { events } = seed();
    const tomorrow = events.filter((e) => new Date(e.start_datetime).toDateString() === addDays(NOW, 1).toDateString());
    expect(peakConcurrency(tomorrow).count).toBe(2);
  });
});

describe("Daily brief", () => {
  it("reacts to event edits immediately (pure derivation)", () => {
    const { events, members } = seed();
    const before = buildDailyBrief(events, members, NOW);
    const edited = events.filter((e) => e.title !== "Hockey Practice");
    const after = buildDailyBrief(edited, members, NOW);
    expect(before.attention.some((i) => i.kind === "transport_conflict")).toBe(true);
    expect(after.attention.some((i) => i.kind === "transport_conflict")).toBe(false);
  });
});
