import {
  CalendarDays,
  Car,
  GraduationCap,
  House,
  Inbox,
  ListChecks,
  PawPrint,
  Settings,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/family", label: "Family", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/transportation", label: "Transportation", icon: Car },
  { href: "/school", label: "School", icon: GraduationCap },
  { href: "/chores", label: "Chores", icon: ListChecks },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/pets", label: "Pets", icon: PawPrint },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
