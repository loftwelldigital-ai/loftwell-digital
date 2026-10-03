/* eslint-disable @next/next/no-img-element -- avatars are arbitrary user URLs */
import { MEMBER_COLOR_VALUES } from "@/lib/labels";
import type { FamilyMember } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

export function MemberAvatar({
  member,
  size = "md",
  className,
}: {
  member: Pick<FamilyMember, "full_name" | "nickname" | "avatar_url" | "calendar_color">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const color = MEMBER_COLOR_VALUES[member.calendar_color];
  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.nickname}
        className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", SIZES[size], className)}
      style={{ backgroundColor: color.soft, color: color.solid }}
    >
      {initials(member.full_name || member.nickname)}
    </span>
  );
}

export function ColorDot({ color, className }: { color: FamilyMember["calendar_color"]; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: MEMBER_COLOR_VALUES[color].solid }}
    />
  );
}

/** Small "● Jensen" label used in timelines and lists. */
export function MemberTag({ member }: { member: FamilyMember }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-2">
      <ColorDot color={member.calendar_color} />
      <span className="font-medium">{member.nickname}</span>
    </span>
  );
}
