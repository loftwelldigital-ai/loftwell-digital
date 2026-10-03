"use client";

import { useSyncExternalStore } from "react";
import { getRepository, type HouseholdSnapshot } from "../data";
import type { EventDraft, FamilyMember, FoldEvent, ID, MemberDraft } from "../types";
import { newId, nowISO } from "../utils";

/**
 * Client-side household store.
 *
 * A single in-memory snapshot is shared by every screen, so an edit anywhere
 * (e.g. the event editor) immediately re-renders Home, Calendar and Family.
 * Writes are applied optimistically, then persisted through the repository.
 */

type Status = "idle" | "loading" | "ready" | "error";

export interface HouseholdState {
  status: Status;
  data: HouseholdSnapshot | null;
}

const SERVER_STATE: HouseholdState = { status: "idle", data: null };

let state: HouseholdState = SERVER_STATE;
const listeners = new Set<() => void>();

function setState(next: HouseholdState) {
  state = next;
  listeners.forEach((l) => l());
}

async function load() {
  setState({ status: "loading", data: null });
  try {
    const data = await getRepository().load();
    setState({ status: "ready", data });
  } catch (error) {
    console.error("Failed to load household", error);
    setState({ status: "error", data: null });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.status === "idle") void load();
  return () => {
    listeners.delete(listener);
  };
}

export function useHouseholdState(): HouseholdState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

function updateData(fn: (d: HouseholdSnapshot) => HouseholdSnapshot) {
  if (!state.data) return;
  const next = fn(state.data);
  setState({ ...state, data: { ...next, meta: { ...next.meta, modified: true } } });
}

function upsertById<T extends { id: ID }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

function requireData(): HouseholdSnapshot {
  if (!state.data) throw new Error("Household data is not loaded yet.");
  return state.data;
}

export const householdActions = {
  async saveEvent(draft: EventDraft): Promise<FoldEvent> {
    const data = requireData();
    const existing = draft.id ? data.events.find((e) => e.id === draft.id) : undefined;
    const now = nowISO();
    const event: FoldEvent = {
      ...draft,
      id: existing?.id ?? newId(),
      household_id: data.household.id,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    updateData((d) => ({ ...d, events: upsertById(d.events, event) }));
    await getRepository().upsertEvent(event);
    return event;
  },

  async deleteEvent(id: ID): Promise<void> {
    updateData((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
    await getRepository().deleteEvent(id);
  },

  async setPrepNoteDone(eventId: ID, noteId: ID, done: boolean): Promise<void> {
    const event = requireData().events.find((e) => e.id === eventId);
    if (!event) return;
    const updated: FoldEvent = {
      ...event,
      prep_notes: event.prep_notes.map((n) => (n.id === noteId ? { ...n, done } : n)),
      updated_at: nowISO(),
    };
    updateData((d) => ({ ...d, events: upsertById(d.events, updated) }));
    await getRepository().upsertEvent(updated);
  },

  async saveMember(draft: MemberDraft): Promise<FamilyMember> {
    const data = requireData();
    const existing = draft.id ? data.members.find((m) => m.id === draft.id) : undefined;
    const now = nowISO();
    const member: FamilyMember = {
      ...draft,
      id: existing?.id ?? newId(),
      household_id: data.household.id,
      sort_order: existing?.sort_order ?? Math.max(-1, ...data.members.map((m) => m.sort_order)) + 1,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    updateData((d) => ({ ...d, members: upsertById(d.members, member) }));
    await getRepository().upsertMember(member);
    return member;
  },

  /** Removes a member and detaches them from events (events themselves are kept). */
  async deleteMember(id: ID): Promise<void> {
    const data = requireData();
    const touched = data.events
      .filter((e) => e.family_members.includes(id) || e.passengers.includes(id) || e.driver === id)
      .map<FoldEvent>((e) => ({
        ...e,
        family_members: e.family_members.filter((m) => m !== id),
        passengers: e.passengers.filter((m) => m !== id),
        driver: e.driver === id ? null : e.driver,
        updated_at: nowISO(),
      }));
    updateData((d) => ({
      ...d,
      members: d.members.filter((m) => m.id !== id),
      events: touched.reduce((list, e) => upsertById(list, e), d.events),
    }));
    const repo = getRepository();
    await Promise.all(touched.map((e) => repo.upsertEvent(e)));
    await repo.deleteMember(id);
  },

  async resetDemo(): Promise<void> {
    const data = await getRepository().resetDemo();
    setState({ status: "ready", data });
  },
};
