"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useHousehold } from "@/lib/hooks/use-household";
import type { EventDraft, ID } from "@/lib/types";
import { blankEventDraft, EventEditor } from "./event-editor";

interface EventEditorApi {
  openEvent: (id: ID) => void;
  newEvent: (defaults?: Partial<EventDraft>, day?: Date) => void;
}

const EventEditorContext = createContext<EventEditorApi | null>(null);

/** Lets any screen open the shared event editor (Home timeline, Calendar, Family). */
export function EventEditorProvider({ children }: { children: ReactNode }) {
  const { events } = useHousehold();
  const [session, setSession] = useState<{ key: number; draft: EventDraft } | null>(null);

  const openEvent = useCallback(
    (id: ID) => {
      const event = events.find((e) => e.id === id);
      if (event) setSession({ key: Date.now(), draft: event });
    },
    [events],
  );
  const newEvent = useCallback((defaults?: Partial<EventDraft>, day?: Date) => {
    setSession({ key: Date.now(), draft: blankEventDraft(defaults, day) });
  }, []);

  const api = useMemo(() => ({ openEvent, newEvent }), [openEvent, newEvent]);

  return (
    <EventEditorContext.Provider value={api}>
      {children}
      {session && <EventEditor key={session.key} draft={session.draft} onClose={() => setSession(null)} />}
    </EventEditorContext.Provider>
  );
}

export function useEventEditor(): EventEditorApi {
  const ctx = useContext(EventEditorContext);
  if (!ctx) throw new Error("useEventEditor must be used inside EventEditorProvider");
  return ctx;
}
