"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { Card, SectionLabel } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/page";
import { buildDailyBrief } from "@/lib/brief/engine";
import { useHousehold } from "@/lib/hooks/use-household";
import { useNow } from "@/lib/hooks/use-now";
import { NeedsAttention } from "./needs-attention";
import { TodayTimeline } from "./today-timeline";
import { TomorrowBrief } from "./tomorrow-brief";

/**
 * HOME answers exactly three questions:
 *   What is happening today? What needs my attention? What should I know about tomorrow?
 * Nothing else belongs on this screen.
 */
export function HomeScreen() {
  const { ready, events, members } = useHousehold();
  const now = useNow();
  const brief = useMemo(() => (now && ready ? buildDailyBrief(events, members, now) : null), [events, members, now, ready]);

  if (!brief || !now) return <LoadingState />;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 md:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px]">{format(now, "EEEE, MMMM d")}</h1>
        <p className="tabular text-2xl font-medium text-ink-3 md:text-3xl">{format(now, "h:mm a")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <section aria-labelledby="today-label" className="lg:col-span-7">
          <Card className="px-4 py-6 md:px-8 md:py-8">
            <SectionLabel id="today-label" className="mb-3">
              Today
            </SectionLabel>
            <TodayTimeline items={brief.today} />
          </Card>
        </section>

        <div className="space-y-6 lg:col-span-5 lg:space-y-8">
          <section aria-labelledby="attention-label">
            <SectionLabel id="attention-label" className="mb-4">
              Needs attention
            </SectionLabel>
            <NeedsAttention items={brief.attention} />
          </section>

          <section aria-labelledby="tomorrow-label">
            <Card className="px-5 py-6 md:px-7 md:py-7">
              <SectionLabel id="tomorrow-label" className="mb-3">
                Tomorrow
              </SectionLabel>
              <TomorrowBrief brief={brief.tomorrow} />
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
