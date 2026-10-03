import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

/** Groups non-input controls (chips, toggles) under a label without a <label>. */
export function FieldGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("block", className)}>
      <legend className="mb-2 block text-sm font-medium text-ink-2">{label}</legend>
      {children}
    </fieldset>
  );
}

const inputBase =
  "w-full h-12 rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none transition-colors";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "h-auto min-h-24 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputBase, "appearance-none bg-[length:16px] pr-10", className)} {...props}>
      {children}
    </select>
  );
}

/** Large pill toggle — used for multi/single selection of family members, types, etc. */
export function Chip({
  selected,
  onClick,
  children,
  className,
  style,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={style}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-colors",
        selected ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2 hover:border-line-strong",
        className,
      )}
    >
      {selected && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-line-strong"
    >
      <span>
        <span className="block text-base font-medium text-ink">{label}</span>
        {description && <span className="block text-sm text-ink-3">{description}</span>}
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-surface shadow transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}
