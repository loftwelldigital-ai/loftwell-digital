import { LocalHouseholdRepository } from "./local-repository";
import type { HouseholdRepository } from "./repository";

let repository: HouseholdRepository | null = null;

/**
 * Single place that decides which persistence backend is used.
 * When Supabase is added, select SupabaseHouseholdRepository here based on
 * configuration/auth — no UI code changes required.
 */
export function getRepository(): HouseholdRepository {
  if (!repository) repository = new LocalHouseholdRepository();
  return repository;
}

export type { HouseholdRepository, HouseholdSnapshot, SnapshotMeta } from "./repository";
