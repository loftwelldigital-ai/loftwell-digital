import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Inbox" };

export default function Page() {
  return (
    <ComingSoon
      title="Inbox"
      icon={Inbox}
      purpose="Hand Fold the mess — photos, PDFs, screenshots, emails — and review what it found before anything is saved."
      points={[
        "Upload a schedule, permission slip, or document",
        "See extracted details clearly marked for review",
        "Approve before anything becomes household data",
      ]}
    />
  );
}
