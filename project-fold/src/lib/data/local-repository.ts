import { createSeed } from "../mock/seed";
import type { FamilyMember, FoldEvent, ID } from "../types";
import { toDateKey } from "../utils";
import type { HouseholdRepository, HouseholdSnapshot } from "./repository";

const STORAGE_KEY = "project-fold:v1";

function freshSnapshot(): HouseholdSnapshot {
  const seed = createSeed(new Date());
  return {
    ...seed,
    meta: { is_demo: true, modified: false, seed_date: toDateKey(new Date()) },
  };
}

/** localStorage-backed repository for the mock/demo phase. */
export class LocalHouseholdRepository implements HouseholdRepository {
  private read(): HouseholdSnapshot | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as HouseholdSnapshot) : null;
    } catch {
      return null;
    }
  }

  private write(snapshot: HouseholdSnapshot): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full or unavailable (private mode). The in-memory store still works.
    }
  }

  private mutate(fn: (s: HouseholdSnapshot) => HouseholdSnapshot): void {
    const current = this.read() ?? freshSnapshot();
    const next = fn(current);
    this.write({ ...next, meta: { ...next.meta, modified: true } });
  }

  async load(): Promise<HouseholdSnapshot> {
    const stored = this.read();
    const today = toDateKey(new Date());
    // Untouched demo data is regenerated each day so "today" stays realistic.
    if (!stored || (stored.meta.is_demo && !stored.meta.modified && stored.meta.seed_date !== today)) {
      const fresh = freshSnapshot();
      this.write(fresh);
      return fresh;
    }
    return stored;
  }

  async upsertMember(member: FamilyMember): Promise<void> {
    this.mutate((s) => ({ ...s, members: upsert(s.members, member) }));
  }

  async deleteMember(id: ID): Promise<void> {
    this.mutate((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
  }

  async upsertEvent(event: FoldEvent): Promise<void> {
    this.mutate((s) => ({ ...s, events: upsert(s.events, event) }));
  }

  async deleteEvent(id: ID): Promise<void> {
    this.mutate((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  }

  async resetDemo(): Promise<HouseholdSnapshot> {
    const fresh = freshSnapshot();
    this.write(fresh);
    return fresh;
  }
}

function upsert<T extends { id: ID }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  const copy = list.slice();
  copy[index] = item;
  return copy;
}

