import type { FamilyMember, FoldEvent, Household, ID } from "../types";

/**
 * Persistence boundary. UI code never talks to storage directly — it goes
 * through the household store, which calls a HouseholdRepository.
 *
 * Today: LocalHouseholdRepository (browser localStorage, demo data).
 * Later: SupabaseHouseholdRepository implementing the same interface, with
 * Row Level Security scoping every query to the signed-in household.
 *
 * All methods are async so swapping in a network-backed implementation does
 * not change any call sites.
 */
export interface HouseholdSnapshot {
  household: Household;
  members: FamilyMember[];
  events: FoldEvent[];
  meta: SnapshotMeta;
}

export interface SnapshotMeta {
  /** True when the data is generated demo data. */
  is_demo: boolean;
  /** True once the user has changed anything. Untouched demo data is regenerated daily. */
  modified: boolean;
  /** yyyy-MM-dd the demo data was generated for. */
  seed_date: string | null;
}

export interface HouseholdRepository {
  load(): Promise<HouseholdSnapshot>;

  upsertMember(member: FamilyMember): Promise<void>;
  deleteMember(id: ID): Promise<void>;

  upsertEvent(event: FoldEvent): Promise<void>;
  deleteEvent(id: ID): Promise<void>;

  /** Discard everything and start from fresh demo data. */
  resetDemo(): Promise<HouseholdSnapshot>;
}
