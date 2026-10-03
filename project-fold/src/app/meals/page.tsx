import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Meals" };

export default function Page() {
  return (
    <ComingSoon
      title="Meals"
      icon={UtensilsCrossed}
      purpose="Breakfast, lunch and dinner — plus a pantry that only asks for Stocked, Low or Out."
      points={[
        "Today's and upcoming meals",
        "One-tap add to grocery list",
        "Grocery list by store and category",
      ]}
    />
  );
}
