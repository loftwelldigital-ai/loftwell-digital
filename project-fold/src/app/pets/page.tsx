import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Pets" };

export default function Page() {
  return (
    <ComingSoon
      title="Pets"
      icon={PawPrint}
      purpose="Feeding, medication and vet visits — important appointments flow into Today."
      points={[
        "Individual pets and groups (e.g. Puppies)",
        "Medication schedules",
        "Assign pet care to family members",
      ]}
    />
  );
}
