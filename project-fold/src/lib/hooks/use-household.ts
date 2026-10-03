"use client";

import { useMemo } from "react";
import { useHouseholdState } from "../store/household-store";
import type { FamilyMember, FoldEvent, Household, ID } from "../types";

export interface HouseholdView {
  ready: boolean;
  error: boolean;
  household: Household | null;
  members: FamilyMember[];
  events: FoldEvent[];
  memberById: Map<ID, FamilyMember>;
  isDemo: boolean;
}

const EMPTY: FamilyMember[] = [];
const NO_EVENTS: FoldEvent[] = [];

export function useHousehold(): HouseholdView {
  const { status, data } = useHouseholdState();
  const members = useMemo(
    () => (data ? [...data.members].sort((a, b) => a.sort_order - b.sort_order) : EMPTY),
    [data],
  );
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  return {
    ready: status === "ready",
    error: status === "error",
    household: data?.household ?? null,
    members,
    events: data?.events ?? NO_EVENTS,
    memberById,
    isDemo: data?.meta.is_demo ?? false,
  };
}
