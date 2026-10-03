import type { Metadata } from "next";
import { Car } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Transportation" };

export default function Page() {
  return (
    <ComingSoon
      title="Transportation"
      icon={Car}
      purpose="Who is driving whom, when the car has to leave, and where the gaps are."
      points={[
        "Today's driving in chronological order",
        "Driver conflicts and unassigned rides",
        "Pickup, drop-off and return legs",
      ]}
    />
  );
}
