import { MemberFormPage } from "@/components/family/member-form";

export default async function EditMemberPage(props: PageProps<"/family/[id]/edit">) {
  const { id } = await props.params;
  return <MemberFormPage memberId={id} />;
}
