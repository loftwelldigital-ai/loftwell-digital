import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "School" };

export default function Page() {
  return (
    <ComingSoon
      title="School"
      icon={GraduationCap}
      purpose="Exception-based school management: who is on track, who needs a parent today."
      points={[
        "Today's school at a glance",
        "Parent Help Queue with time estimates",
        "Per-child subjects, lessons and progress",
      ]}
    />
  );
}
