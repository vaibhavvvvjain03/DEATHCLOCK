import { useState, useEffect, useCallback } from "react";

/**
 * Syncs React state with localStorage under a
 * given key. Used for persisting session data
 * (city name, carbon data, audit answers, swaps,
 * committed missions) across page navigations.
 *
 * SSR-safe: localStorage is only accessed
 * client-side, guarded by typeof window checks.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Initialize from localStorage on first client render,
  // fall back to defaultValue if missing or unparseable.
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  // Keep state in sync if another tab/window writes the
  // same key (optional but useful for multi-tab scenarios).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const raw = e.newValue;
        setState(raw !== null ? (JSON.parse(raw) as T) : defaultValue);
      } catch {
        setState(defaultValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T) => {
      setState(value);
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently ignore quota errors or private-browsing restrictions.
      }
    },
    [key]
  );

  return [state, setValue];
}
