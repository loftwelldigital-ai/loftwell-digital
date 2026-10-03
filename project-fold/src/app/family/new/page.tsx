import type { Metadata } from "next";
import { MemberFormPage } from "@/components/family/member-form";

export const metadata: Metadata = { title: "Add family member" };

export default function NewMemberPage() {
  return <MemberFormPage />;
}
