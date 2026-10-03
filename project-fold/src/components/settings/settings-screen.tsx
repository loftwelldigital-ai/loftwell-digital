"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { LoadingState, PageBody, PageHeader } from "@/components/ui/page";
import { useHousehold } from "@/lib/hooks/use-household";
import { householdActions } from "@/lib/store/household-store";

const INTEGRATIONS = [
  { name: "Google Calendar", note: "Read, import and create events with approval." },
  { name: "Email", note: "Forward schedules and documents into the Inbox." },
  { name: "Team apps", note: "Crossbar, TeamReach, SportsEngine — via supported imports only." },
];

export function SettingsScreen() {
  const { ready, household, isDemo, members, events } = useHousehold();
  const [confirm, setConfirm] = useState(false);
  if (!ready) return <LoadingState />;

  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <Card className="p-5 md:p-7">
          <SectionLabel className="mb-4">Household</SectionLabel>
          <p className="text-lg font-medium">{household?.name}</p>
          <p className="mt-1 text-sm text-ink-3">
            {members.length} people · {events.length} events · Time zone {household?.timezone}
          </p>
        </Card>

        <Card className="p-5 md:p-7">
          <SectionLabel className="mb-4">Data</SectionLabel>
          <p className="text-base text-ink">
            {isDemo ? "Demo mode — data is stored only in this browser." : "Stored in this browser."}
          </p>
          <p className="mt-1 text-sm text-ink-3">
            Untouched demo data refreshes each day so Today and Tomorrow stay realistic. Accounts and cloud sync come
            with the Supabase phase.
          </p>
          <div className="mt-5">
            {confirm ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-ink-2">Replace all data with fresh demo data?</span>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await householdActions.resetDemo();
                    setConfirm(false);
                  }}
                >
                  Reset
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setConfirm(true)}>
                <RotateCcw className="size-4" aria-hidden /> Reset demo data
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <SectionLabel className="mb-4">Integrations</SectionLabel>
          <ul className="divide-y divide-line">
            {INTEGRATIONS.map((i) => (
              <li key={i.name} className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-base font-medium">{i.name}</span>
                  <span className="block text-sm text-ink-3">{i.note}</span>
                </span>
                <span className="shrink-0 rounded-full bg-sunken px-3 py-1 text-xs font-medium text-ink-3">
                  Not connected
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageBody>
  );
}
