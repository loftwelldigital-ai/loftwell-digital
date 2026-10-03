import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { PageBody, PageHeader } from "./page";

/** Calm placeholder for sections scheduled in later build phases. */
export function ComingSoon({
  title,
  icon: Icon,
  purpose,
  points,
}: {
  title: string;
  icon: LucideIcon;
  purpose: string;
  points: string[];
}) {
  return (
    <PageBody>
      <PageHeader title={title} />
      <Card className="max-w-2xl p-6 md:p-8">
        <Icon className="size-7 text-ink-3" strokeWidth={1.5} aria-hidden />
        <p className="mt-4 text-lg font-medium leading-snug text-ink">{purpose}</p>
        <ul className="mt-5 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-base text-ink-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-3">Not built yet — scheduled for a later phase.</p>
      </Card>
    </PageBody>
  );
}
