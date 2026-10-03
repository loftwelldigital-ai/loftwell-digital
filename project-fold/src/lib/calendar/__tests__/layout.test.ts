import { describe, expect, it } from "vitest";
import { createSeed } from "../../mock/seed";
import type { FoldEvent } from "../../types";
import { involvesAny, layoutLanes } from "../layout";

const base = createSeed(new Date(2026, 9, 5)).events[0];
function ev(id: string, start: string, end: string): FoldEvent {
  return {
    ...base,
    id,
    start_datetime: new Date(`2026-10-05T${start}:00`).toISOString(),
    end_datetime: new Date(`2026-10-05T${end}:00`).toISOString(),
  };
}

describe("layoutLanes", () => {
  it("puts overlapping events side by side and keeps separate clusters full width", () => {
    const out = layoutLanes([ev("a", "09:00", "10:00"), ev("b", "09:30", "11:00"), ev("c", "12:00", "13:00")]);
    const by = Object.fromEntries(out.map((p) => [p.event.id, p]));
    expect(by.a.lane).toBe(0);
    expect(by.b.lane).toBe(1);
    expect(by.a.lanes).toBe(2);
    expect(by.c.lanes).toBe(1);
  });

  it("reuses a lane once it frees up within a cluster", () => {
    const out = layoutLanes([ev("a", "09:00", "10:00"), ev("b", "09:00", "12:00"), ev("c", "10:00", "11:00")]);
    const by = Object.fromEntries(out.map((p) => [p.event.id, p]));
    expect(by.c.lane).toBe(by.a.lane);
    expect(by.c.lanes).toBe(2);
  });
});

describe("involvesAny", () => {
  it("matches drivers and passengers, not just participants", () => {
    const e = { ...ev("a", "09:00", "10:00"), family_members: ["kid"], driver: "dad", passengers: ["kid"] };
    expect(involvesAny(e, new Set(["dad"]))).toBe(true);
    expect(involvesAny(e, new Set(["mom"]))).toBe(false);
    expect(involvesAny(e, new Set())).toBe(true);
  });
});
