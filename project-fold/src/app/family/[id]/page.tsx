import { MemberProfile } from "@/components/family/member-profile";

export default async function MemberPage(props: PageProps<"/family/[id]">) {
  const { id } = await props.params;
  return <MemberProfile memberId={id} />;
}
