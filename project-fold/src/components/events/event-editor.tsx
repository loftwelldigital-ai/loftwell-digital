"use client";

import { addHours, format, parseISO, startOfHour } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ColorDot } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip, Field, FieldGroup, Select, TextArea, TextInput, Toggle } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { useHousehold } from "@/lib/hooks/use-household";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/labels";
import { householdActions } from "@/lib/store/household-store";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  type EventDraft,
  type EventStatus,
  type EventType,
  type ID,
  type PrepNote,
} from "@/lib/types";
import { cn, combineDateTime, newId, toDateKey, toTimeInput } from "@/lib/utils";

const SPORT_TYPES: EventType[] = ["practice", "game", "tournament"];
const REMINDER_OPTIONS = [
  { minutes: 10, label: "10 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 1440, label: "1 day" },
];

export function blankEventDraft(defaults: Partial<EventDraft> = {}, day: Date = new Date()): EventDraft {
  const start = startOfHour(addHours(day, 1));
  return {
    title: "",
    description: "",
    event_type: "appointment",
    start_datetime: start.toISOString(),
    end_datetime: addHours(start, 1).toISOString(),
    all_day: false,
    location: "",
    family_members: [],
    source: "manual",
    sport_team: null,
    dismissal_time: null,
    arrival_time: null,
    departure_time: null,
    transportation_required: false,
    driver: null,
    passengers: [],
    reminders: [],
    prep_notes: [],
    attachments: [],
    external_calendar_id: null,
    status: "scheduled",
    ...defaults,
  };
}

interface FormState {
  title: string;
  event_type: EventType;
  date: string;
  start: string;
  end: string;
  all_day: boolean;
  location: string;
  family_members: ID[];
  description: string;
  sport_team: string;
  arrival: string;
  departure: string;
  dismissal: string;
  transportation_required: boolean;
  driver: ID | null;
  passengers: ID[];
  reminders: number[];
  prep_notes: PrepNote[];
  status: EventStatus;
}

function toForm(d: EventDraft): FormState {
  return {
    title: d.title,
    event_type: d.event_type,
    date: toDateKey(parseISO(d.start_datetime)),
    start: toTimeInput(d.start_datetime),
    end: toTimeInput(d.end_datetime),
    all_day: d.all_day,
    location: d.location,
    family_members: d.family_members,
    description: d.description,
    sport_team: d.sport_team ?? "",
    arrival: toTimeInput(d.arrival_time),
    departure: toTimeInput(d.departure_time),
    dismissal: toTimeInput(d.dismissal_time),
    transportation_required: d.transportation_required,
    driver: d.driver,
    passengers: d.passengers,
    reminders: d.reminders.map((r) => r.minutes_before),
    prep_notes: d.prep_notes,
    status: d.status,
  };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function EventEditor({ draft, onClose }: { draft: EventDraft; onClose: () => void }) {
  const { members } = useHousehold();
  const [form, setForm] = useState<FormState>(() => toForm(draft));
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = !draft.id;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const drivers = useMemo(() => members.filter((m) => m.can_drive), [members]);
  const isSport = SPORT_TYPES.includes(form.event_type);
  const showDismissal = form.event_type === "dismissal" || form.event_type === "school";

  async function save() {
    if (!form.title.trim()) return setError("Give the event a title.");
    const startTime = form.all_day ? "00:00" : form.start || "09:00";
    const endTime = form.all_day ? "23:59" : form.end || form.start || "10:00";
    const start = combineDateTime(form.date, startTime);
    const end = combineDateTime(form.date, endTime);
    if (end <= start && !form.all_day) return setError("End time must be after the start time.");
    const at = (t: string) => (t ? combineDateTime(form.date, t) : null);

    const passengers = form.transportation_required
      ? form.passengers.length
        ? form.passengers
        : form.family_members.filter((id) => id !== form.driver)
      : [];

    await householdActions.saveEvent({
      ...draft,
      title: form.title.trim(),
      event_type: form.event_type,
      start_datetime: start,
      end_datetime: end,
      all_day: form.all_day,
      location: form.location.trim(),
      family_members: form.family_members,
      description: form.description,
      sport_team: isSport && form.sport_team.trim() ? form.sport_team.trim() : null,
      arrival_time: at(form.arrival),
      departure_time: form.transportation_required || form.departure ? at(form.departure) : null,
      dismissal_time: showDismissal ? at(form.dismissal) : null,
      transportation_required: form.transportation_required,
      driver: form.transportation_required ? form.driver : null,
      passengers,
      reminders: form.reminders.map((m) => ({ id: newId(), minutes_before: m })),
      prep_notes: form.prep_notes.filter((n) => n.text.trim()),
      status: form.status,
    });
    onClose();
  }

  async function remove() {
    if (!draft.id) return;
    await householdActions.deleteEvent(draft.id);
    onClose();
  }

  function addNote() {
    if (!newNote.trim()) return;
    set("prep_notes", [
      ...form.prep_notes,
      { id: newId(), text: newNote.trim(), important: false, due_datetime: null, done: false },
    ]);
    setNewNote("");
  }

  function updateNote(id: ID, patch: Partial<PrepNote>) {
    set(
      "prep_notes",
      form.prep_notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    );
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {!isNew &&
          (confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={remove}>
                Delete event
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Delete event">
              <Trash2 className="size-4" /> Delete
            </Button>
          ))}
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-sm text-critical">{error}</span>}
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} className="min-w-28">
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={isNew ? "New event" : "Edit event"} footer={footer}>
      <div className="space-y-8">
        <TextInput
          autoFocus={isNew}
          value={form.title}
          onChange={(e) => {
            set("title", e.target.value);
            setError(null);
          }}
          placeholder="What is happening?"
          className="h-14 text-xl font-medium"
          aria-label="Title"
        />

        <FieldGroup label="Type">
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <Chip key={t} selected={form.event_type === t} onClick={() => set("event_type", t)}>
                {EVENT_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date">
            <TextInput type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </Field>
          <Field label="Starts">
            <TextInput
              type="time"
              value={form.start}
              disabled={form.all_day}
              onChange={(e) => {
                set("start", e.target.value);
                setError(null);
              }}
            />
          </Field>
          <Field label="Ends">
            <TextInput
              type="time"
              value={form.end}
              disabled={form.all_day}
              onChange={(e) => {
                set("end", e.target.value);
                setError(null);
              }}
            />
          </Field>
        </div>
        <Toggle checked={form.all_day} onChange={(v) => set("all_day", v)} label="All day" />

        <FieldGroup label="Who">
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Chip
                key={m.id}
                selected={form.family_members.includes(m.id)}
                onClick={() => set("family_members", toggle(form.family_members, m.id))}
              >
                {!form.family_members.includes(m.id) && <ColorDot color={m.calendar_color} />}
                {m.nickname}
              </Chip>
            ))}
          </div>
        </FieldGroup>

        <Field label="Where">
          <TextInput value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location or link" />
        </Field>

        {isSport && (
          <Field label="Sport / team">
            <TextInput
              value={form.sport_team}
              onChange={(e) => set("sport_team", e.target.value)}
              placeholder="e.g. Riverside Hawks 16U"
            />
          </Field>
        )}

        {!form.all_day && (
          <div className={cn("grid gap-4", showDismissal ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            <Field label="Arrive by" hint="Warmups, check-in">
              <TextInput type="time" value={form.arrival} onChange={(e) => set("arrival", e.target.value)} />
            </Field>
            <Field label="Leave home at" hint="Defaults to 30 min before">
              <TextInput type="time" value={form.departure} onChange={(e) => set("departure", e.target.value)} />
            </Field>
            {showDismissal && (
              <Field label="Dismissal time">
                <TextInput type="time" value={form.dismissal} onChange={(e) => set("dismissal", e.target.value)} />
              </Field>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Toggle
            checked={form.transportation_required}
            onChange={(v) => {
              set("transportation_required", v);
              if (v && form.passengers.length === 0) set("passengers", form.family_members);
            }}
            label="Needs a ride"
            description="Someone has to drive for this event."
          />
          {form.transportation_required && (
            <div className="space-y-5 rounded-2xl border border-line bg-sunken/40 p-4">
              <FieldGroup label="Driver">
                <div className="flex flex-wrap gap-2">
                  <Chip selected={form.driver === null} onClick={() => set("driver", null)}>
                    Not assigned
                  </Chip>
                  {drivers.map((m) => (
                    <Chip key={m.id} selected={form.driver === m.id} onClick={() => set("driver", m.id)}>
                      {m.nickname}
                    </Chip>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label="Passengers">
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Chip
                      key={m.id}
                      selected={form.passengers.includes(m.id)}
                      onClick={() => set("passengers", toggle(form.passengers, m.id))}
                    >
                      {m.nickname}
                    </Chip>
                  ))}
                </div>
              </FieldGroup>
            </div>
          )}
        </div>

        <FieldGroup label="Prepare">
          <div className="space-y-2">
            {form.prep_notes.map((n) => (
              <div key={n.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2 pl-4">
                <span className={cn("min-w-0 flex-1 text-base", n.done && "text-ink-3 line-through")}>{n.text}</span>
                <TextInput
                  type="datetime-local"
                  aria-label="Due"
                  title="Due (optional)"
                  value={n.due_datetime ? format(parseISO(n.due_datetime), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) =>
                    updateNote(n.id, { due_datetime: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  className="h-11 w-auto text-sm"
                />
                <Chip selected={n.important} onClick={() => updateNote(n.id, { important: !n.important })}>
                  Important
                </Chip>
                <button
                  type="button"
                  onClick={() => set("prep_notes", form.prep_notes.filter((x) => x.id !== n.id))}
                  className="inline-flex size-11 items-center justify-center rounded-full text-ink-3 hover:bg-sunken hover:text-ink"
                  aria-label={`Remove ${n.text}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <TextInput
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNote();
                  }
                }}
                placeholder="Bring paperwork, uniform, signed form…"
              />
              <Button onClick={addNote} aria-label="Add preparation item" className="h-12 shrink-0">
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <p className="text-xs text-ink-3">Important items appear under Needs Attention.</p>
          </div>
        </FieldGroup>

        <FieldGroup label="Reminders">
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((r) => (
              <Chip
                key={r.minutes}
                selected={form.reminders.includes(r.minutes)}
                onClick={() => set("reminders", toggle(form.reminders, r.minutes))}
              >
                {r.label} before
              </Chip>
            ))}
          </div>
        </FieldGroup>

        <Field label="Notes">
          <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value as EventStatus)}>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EVENT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="text-sm text-ink-3 sm:pt-9">
            Source: {draft.source === "manual" ? "Entered manually" : draft.source}
            {draft.attachments.length > 0 && ` · ${draft.attachments.length} attachment(s)`}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
