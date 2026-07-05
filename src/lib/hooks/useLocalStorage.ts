"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getStoredValue, setStoredValue } from "@/lib/storage";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const getSnapshot = useCallback(
    () => getStoredValue(key, initialValue),
    [key, initialValue],
  );
  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setStoredState = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getStoredValue(key, initialValue);
      const resolved = next instanceof Function ? next(prev) : next;
      setStoredValue(key, resolved);
      emitChange();
    },
    [key, initialValue],
  );

  return [value, setStoredState] as const;
}
