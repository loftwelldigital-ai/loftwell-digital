"use client";

import { useSyncExternalStore } from "react";

/**
 * Current time, ticking once a minute. Returns null during server render and
 * hydration so time-dependent UI never causes a hydration mismatch.
 */
let current: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function tick() {
  current = Math.floor(Date.now() / 60_000) * 60_000;
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) tick();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (current === null) current = Math.floor(Date.now() / 60_000) * 60_000;
  return current;
}

export function useNow(): Date | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return value === null ? null : new Date(value);
}
