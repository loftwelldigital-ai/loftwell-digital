"use client";

import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Car, Mail, Pencil, Phone, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useEventEditor } from "@/components/events/event-editor-context";
import { MemberAvatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { LoadingState, PageBody, PageHeader } from "@/components/ui/page";
import { involvesAny } from "@/lib/calendar/layout";
import { useHousehold } from "@/lib/hooks/use-household";
import { useNow } from "@/lib/hooks/use-now";
import { SCHOOL_LEVEL_LABELS } from "@/lib/labels";
import type { FamilyMember, FoldEvent, ID } from "@/lib/types";
import { formatTime, joinNames, sameDay } from "@/lib/utils";
import { memberSummary } from "./family-overview";

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className ?? "p-5 md:p-6"}>
      <SectionLabel className="mb-4">{title}</SectionLabel>
      {children}
    </Card>
  );
}

function EventRow({ event, member, memberById, showDate }: {
  event: FoldEvent;
  member: FamilyMember;
  memberById: Map<ID, FamilyMember>;
  showDate?: boolean;
}) {
  const { openEvent } = useEventEditor();
  const driving = event.driver === member.id;
  const others = event.family_members.filter((id) => id !== member.id).map((id) => memberById.get(id)?.nickname ?? "");
  return (
    <li>
      <button
        type="button"
        onClick={() => openEvent(event.id)}
        className="grid w-full grid-cols-[5.5rem_1fr] gap-3 rounded-xl py-2.5 text-left hover:bg-sunken/50"
      >
        <span className="tabular text-right text-[15px] font-semibold text-ink">
          {showDate ? format(parseISO(event.start_datetime), "EEE d") : formatTime(event.start_datetime)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-medium text-ink">
            {driving ? `Drive ${joinNames(event.passengers.map((id) => memberById.get(id)?.nickname ?? ""))} → ${event.title}` : event.title}
          </span>
          <span className="block truncate text-sm text-ink-3">
            {showDate && `${formatTime(event.start_datetime)} · `}
            {event.location}
            {!driving && others.length > 0 && ` · with ${joinNames(others)}`}
          </span>
        </span>
      </button>
    </li>
  );
}

export function MemberProfile({ memberId }: { memberId: string }) {
  const { ready, events, memberById } = useHousehold();
  const { newEvent } = useEventEditor();
  const now = useNow();

  if (!ready || !now) return <LoadingState />;
  const member = memberById.get(memberId);
  if (!member) {
    return (
      <PageBody>
        <PageHeader title="Not found" subtitle="This family member no longer exists." />
        <ButtonLink href="/family">Back to Family</ButtonLink>
      </PageBody>
    );
  }

  const mine = events
    .filter((e) => e.status !== "cancelled" && involvesAny(e, new Set([member.id])))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  const today = mine.filter((e) => sameDay(e.start_datetime, now));
  const tomorrowStart = addDays(startOfDay(now), 1);
  const upcoming = mine.filter((e) => parseISO(e.start_datetime) >= tomorrowStart).slice(0, 5);
  const rides = mine.filter(
    (e) => e.transportation_required && (sameDay(e.start_datetime, now) || sameDay(e.start_datetime, tomorrowStart)),
  );
  // Sports and appointments are things the member attends, not drives to.
  const attends = (e: FoldEvent) => e.family_members.includes(member.id);
  const teams = [...new Set(mine.filter(attends).map((e) => e.sport_team).filter((t): t is string => Boolean(t)))];
  const appointments = upcoming.filter((e) => e.event_type === "appointment" && attends(e));

  return (
    <PageBody>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <MemberAvatar member={member} size="xl" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{member.nickname}</h1>
            <p className="mt-1 text-base text-ink-2">{member.full_name}</p>
            <p className="mt-1 text-sm text-ink-3">{memberSummary(member)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => newEvent({ family_members: [member.id] }, now)}>
            <Plus className="size-4" aria-hidden /> Event
          </Button>
          <ButtonLink href={`/family/${member.id}/edit`}>
            <Pencil className="size-4" aria-hidden /> Edit
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Section title="Today">
            {today.length ? (
              <ul className="-my-2">
                {today.map((e) => (
                  <EventRow key={e.id} event={e} member={member} memberById={memberById} />
                ))}
              </ul>
            ) : (
              <p className="text-base text-ink-2">Nothing scheduled today.</p>
            )}
          </Section>

          {upcoming.length > 0 && (
            <Section title="Coming up">
              <ul className="-my-2">
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} member={member} memberById={memberById} showDate />
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div className="space-y-6 lg:col-span-5">
          {rides.length > 0 && (
            <Section title="Transportation">
              <ul className="space-y-3">
                {rides.map((e) => {
                  const driving = e.driver === member.id;
                  const driver = e.driver ? memberById.get(e.driver) : null;
                  return (
                    <li key={e.id} className="flex items-start gap-3 text-base">
                      <Car className="mt-1 size-4 shrink-0 text-ink-3" aria-hidden />
                      <span>
                        <span className="font-medium text-ink">
                          {sameDay(e.start_datetime, now) ? "" : "Tomorrow · "}
                          {formatTime(e.start_datetime)} {e.title}
                        </span>
                        <span className={driver || driving ? "block text-sm text-ink-3" : "block text-sm font-medium text-alert"}>
                          {driving
                            ? `Driving ${joinNames(e.passengers.map((id) => memberById.get(id)?.nickname ?? ""))}`
                            : driver
                              ? `Ride with ${driver.nickname}`
                              : "Driver needed"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {(member.sports.length > 0 || teams.length > 0) && (
            <Section title="Sports">
              <p className="text-base text-ink">{member.sports.join(", ") || "—"}</p>
              {teams.length > 0 && <p className="mt-1 text-sm text-ink-3">{teams.join(" · ")}</p>}
            </Section>
          )}

          {member.school_level !== "none" && (
            <Section title="School">
              <p className="text-base text-ink">{SCHOOL_LEVEL_LABELS[member.school_level]}</p>
              {member.school && <p className="mt-1 text-sm text-ink-3">{member.school}</p>}
            </Section>
          )}

          {appointments.length > 0 && (
            <Section title="Appointments">
              <ul className="space-y-2 text-base">
                {appointments.map((e) => (
                  <li key={e.id}>
                    <span className="font-medium">{e.title}</span>{" "}
                    <span className="text-ink-3">{format(parseISO(e.start_datetime), "EEE, MMM d · h:mm a")}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(member.email || member.phone || member.can_drive) && (
            <Section title="Contact">
              <ul className="space-y-2 text-base text-ink-2">
                {member.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 text-ink-3" aria-hidden /> {member.phone}
                  </li>
                )}
                {member.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-ink-3" aria-hidden /> {member.email}
                  </li>
                )}
                {member.can_drive && (
                  <li className="flex items-center gap-2">
                    <Car className="size-4 text-ink-3" aria-hidden /> Licensed driver
                  </li>
                )}
              </ul>
            </Section>
          )}

          {member.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-line text-base leading-relaxed text-ink-2">{member.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </PageBody>
  );
}
