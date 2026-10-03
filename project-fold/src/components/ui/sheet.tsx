"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/**
 * Modal sheet: full-screen on phones, centered panel on tablet/desktop.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-full w-full flex-col bg-canvas md:max-h-[92vh] md:max-w-3xl md:rounded-3xl md:shadow-raised"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-8">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-sunken"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 md:px-8">{footer}</div>}
      </div>
    </div>
  );
}
