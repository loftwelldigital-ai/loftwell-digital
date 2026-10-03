"use client";

import { differenceInYears, parseISO } from "date-fns";
import { Car, Plus } from "lucide-react";
import Link from "next/link";
import { MemberAvatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { LoadingState, PageBody, PageHeader } from "@/components/ui/page";
import { useHousehold } from "@/lib/hooks/use-household";
import { ROLE_LABELS, SCHOOL_LEVEL_LABELS } from "@/lib/labels";
import type { FamilyMember } from "@/lib/types";

export function memberAge(m: FamilyMember, now = new Date()): number | null {
  return m.birth_date ? differenceInYears(now, parseISO(m.birth_date)) : null;
}

export function memberSummary(m: FamilyMember): string {
  const parts: string[] = [ROLE_LABELS[m.role]];
  const age = memberAge(m);
  if (age !== null && m.role !== "parent_admin" && m.role !== "adult") parts.push(`${age}`);
  if (m.school_level !== "none") parts.push(SCHOOL_LEVEL_LABELS[m.school_level]);
  return parts.join(" · ");
}

export function FamilyOverview() {
  const { ready, members, household } = useHousehold();
  if (!ready) return <LoadingState />;

  return (
    <PageBody>
      <PageHeader
        title="Family"
        subtitle={`${household?.name ?? "Household"} · ${members.length} ${members.length === 1 ? "person" : "people"}`}
        actions={
          <ButtonLink href="/family/new" variant="primary">
            <Plus className="size-4" aria-hidden /> Add family member
          </ButtonLink>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {members.map((m) => (
          <li key={m.id}>
            <Link
              href={`/family/${m.id}`}
              className="flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
            >
              <MemberAvatar member={m} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-ink">{m.nickname}</p>
                <p className="truncate text-sm text-ink-3">{m.full_name}</p>
                <p className="mt-1.5 truncate text-sm text-ink-2">{memberSummary(m)}</p>
                {(m.sports.length > 0 || m.can_drive) && (
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-ink-3">
                    {m.can_drive && (
                      <span className="inline-flex items-center gap-1">
                        <Car className="size-3.5" aria-hidden /> Drives
                      </span>
                    )}
                    {m.can_drive && m.sports.length > 0 && <span aria-hidden>·</span>}
                    {m.sports.join(", ")}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {members.length === 0 && <p className="text-ink-2">No family members yet. Add the first person to get started.</p>}
    </PageBody>
  );
}
