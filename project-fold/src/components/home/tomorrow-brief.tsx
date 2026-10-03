import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { TomorrowBrief as Brief } from "@/lib/brief/engine";
import { toDateKey } from "@/lib/utils";

export function TomorrowBrief({ brief }: { brief: Brief }) {
  return (
    <div>
      <p className="text-xl font-semibold leading-snug tracking-tight text-ink">{brief.headline}</p>
      {brief.facts.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {brief.facts.map((f) => (
            <li key={f.id} className="flex gap-3 text-base leading-snug text-ink-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      )}
      <ButtonLink href={`/calendar?view=day&date=${toDateKey(brief.date)}`} className="mt-6">
        See tomorrow <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </div>
  );
}
