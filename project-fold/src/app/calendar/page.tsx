import type { Metadata } from "next";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage(props: PageProps<"/calendar">) {
  const params = await props.searchParams;
  const view = typeof params.view === "string" ? params.view : undefined;
  const date = typeof params.date === "string" ? params.date : undefined;
  return <CalendarView key={`${view}-${date}`} initialMode={view} initialDate={date} />;
}
