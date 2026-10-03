import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Chores" };

export default function Page() {
  return (
    <ComingSoon
      title="Chores"
      icon={ListChecks}
      purpose="Household work treated as operations, not stickers."
      points={[
        "Recurring and one-time chores by person",
        "Deep Clean zones with last-cleaned dates",
        "\"I have 15 / 30 / 60 minutes\" recommendations",
      ]}
    />
  );
}
