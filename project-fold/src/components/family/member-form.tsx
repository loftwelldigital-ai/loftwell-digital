"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberAvatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, Field, FieldGroup, TextArea, TextInput, Toggle } from "@/components/ui/form";
import { LoadingState, PageBody, PageHeader } from "@/components/ui/page";
import { useHousehold } from "@/lib/hooks/use-household";
import { MEMBER_COLOR_VALUES, ROLE_LABELS, SCHOOL_LEVEL_LABELS } from "@/lib/labels";
import { householdActions } from "@/lib/store/household-store";
import { MEMBER_COLORS, MEMBER_ROLES, SCHOOL_LEVELS, type FamilyMember, type MemberDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

function blankMember(usedColors: string[]): MemberDraft {
  return {
    full_name: "",
    nickname: "",
    avatar_url: null,
    role: "child",
    birth_date: null,
    school_level: "none",
    school: null,
    email: null,
    phone: null,
    can_drive: false,
    calendar_color: MEMBER_COLORS.find((c) => !usedColors.includes(c)) ?? "slate",
    sports: [],
    notes: "",
  };
}

export function MemberFormPage({ memberId }: { memberId?: string }) {
  const { ready, members } = useHousehold();
  if (!ready) return <LoadingState />;
  const existing = memberId ? members.find((m) => m.id === memberId) : undefined;
  if (memberId && !existing) {
    return (
      <PageBody>
        <PageHeader title="Not found" subtitle="This family member no longer exists." />
        <ButtonLink href="/family">Back to Family</ButtonLink>
      </PageBody>
    );
  }
  return (
    <MemberForm
      key={memberId ?? "new"}
      initial={existing ?? blankMember(members.map((m) => m.calendar_color))}
      isNew={!existing}
    />
  );
}

function MemberForm({ initial, isNew }: { initial: MemberDraft | FamilyMember; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<MemberDraft>(initial);
  const [sportsText, setSportsText] = useState(initial.sports.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) => setForm((f) => ({ ...f, [key]: value }));
  const blank = (v: string) => (v.trim() ? v.trim() : null);

  async function save() {
    if (!form.full_name.trim()) return setError("Full name is required.");
    const saved = await householdActions.saveMember({
      ...form,
      full_name: form.full_name.trim(),
      nickname: form.nickname.trim() || form.full_name.trim().split(/\s+/)[0],
      sports: sportsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    router.push(`/family/${saved.id}`);
  }

  async function remove() {
    if (!form.id) return;
    await householdActions.deleteMember(form.id);
    router.push("/family");
  }

  return (
    <PageBody className="max-w-3xl">
      <PageHeader
        title={isNew ? "Add family member" : `Edit ${initial.nickname}`}
        actions={
          <MemberAvatar
            member={{ ...form, nickname: form.nickname || "?", full_name: form.full_name || form.nickname || "?" }}
            size="lg"
          />
        }
      />

      <Card className="space-y-8 p-5 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput
              value={form.full_name}
              onChange={(e) => {
                set("full_name", e.target.value);
                setError(null);
              }}
              autoFocus={isNew}
            />
          </Field>
          <Field label="Nickname" hint="Shown across the app (e.g. Mom, Dad).">
            <TextInput value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
          </Field>
        </div>

        <FieldGroup label="Role">
          <div className="flex flex-wrap gap-2">
            {MEMBER_ROLES.map((r) => (
              <Chip key={r} selected={form.role === r} onClick={() => set("role", r)}>
                {ROLE_LABELS[r]}
              </Chip>
            ))}
          </div>
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Birth date">
            <TextInput
              type="date"
              value={form.birth_date ?? ""}
              onChange={(e) => set("birth_date", e.target.value || null)}
            />
          </Field>
          <Field label="Profile image URL" hint="Optional. Initials are used otherwise.">
            <TextInput
              type="url"
              value={form.avatar_url ?? ""}
              onChange={(e) => set("avatar_url", blank(e.target.value))}
              placeholder="https://…"
            />
          </Field>
        </div>

        <FieldGroup label="School level">
          <div className="flex flex-wrap gap-2">
            {SCHOOL_LEVELS.map((l) => (
              <Chip key={l} selected={form.school_level === l} onClick={() => set("school_level", l)}>
                {SCHOOL_LEVEL_LABELS[l]}
              </Chip>
            ))}
          </div>
        </FieldGroup>
        {form.school_level !== "none" && (
          <Field label="School">
            <TextInput
              value={form.school ?? ""}
              onChange={(e) => set("school", blank(e.target.value))}
              placeholder="School name or Homeschool"
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <TextInput type="email" value={form.email ?? ""} onChange={(e) => set("email", blank(e.target.value))} />
          </Field>
          <Field label="Phone">
            <TextInput type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", blank(e.target.value))} />
          </Field>
        </div>

        <Toggle
          checked={form.can_drive}
          onChange={(v) => set("can_drive", v)}
          label="Can drive"
          description="Licensed drivers can be assigned to transportation."
        />

        <FieldGroup label="Calendar color">
          <div className="flex flex-wrap gap-3">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("calendar_color", c)}
                aria-label={MEMBER_COLOR_VALUES[c].label}
                aria-pressed={form.calendar_color === c}
                className={cn(
                  "size-11 rounded-full ring-offset-2 ring-offset-surface transition",
                  form.calendar_color === c ? "ring-2 ring-ink" : "hover:ring-2 hover:ring-line-strong",
                )}
                style={{ backgroundColor: MEMBER_COLOR_VALUES[c].solid }}
              />
            ))}
          </div>
        </FieldGroup>

        <Field label="Sports" hint="Separate with commas.">
          <TextInput value={sportsText} onChange={(e) => setSportsText(e.target.value)} placeholder="Hockey, Soccer" />
        </Field>

        <Field label="Notes">
          <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </Field>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isNew &&
            (confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-2">Remove {initial.nickname} from the household?</span>
                <Button variant="danger" onClick={remove}>
                  Remove
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden /> Remove
              </Button>
            ))}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-critical">{error}</span>}
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={save}>
            {isNew ? "Add to family" : "Save changes"}
          </Button>
        </div>
      </div>
    </PageBody>
  );
}
