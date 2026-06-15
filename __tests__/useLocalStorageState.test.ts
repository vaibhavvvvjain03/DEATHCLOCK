/**
 * @jest-environment jsdom
 *
 * Tests for hooks/useLocalStorageState.ts
 *
 * Requires jsdom for localStorage access. Each test clears localStorage
 * beforehand to ensure isolation.
 */
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const TEST_KEY = "test_deathclock_key";

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("useLocalStorageState — initial value", () => {
  it("returns defaultValue when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<string>(TEST_KEY, "default")
    );
    expect(result.current[0]).toBe("default");
  });

  it("returns defaultValue for an object type when key is absent", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<{ city: string }>(TEST_KEY, { city: "none" })
    );
    expect(result.current[0]).toEqual({ city: "none" });
  });

  it("reads an existing value from localStorage on mount", () => {
    localStorage.setItem(TEST_KEY, JSON.stringify("pre-existing-value"));
    const { result } = renderHook(() =>
      useLocalStorageState<string>(TEST_KEY, "default")
    );
    expect(result.current[0]).toBe("pre-existing-value");
  });

  it("reads an existing object from localStorage on mount", () => {
    const stored = { city: "Mumbai", score: 42 };
    localStorage.setItem(TEST_KEY, JSON.stringify(stored));
    const { result } = renderHook(() =>
      useLocalStorageState<typeof stored>(TEST_KEY, { city: "", score: 0 })
    );
    expect(result.current[0]).toEqual(stored);
  });

  it("falls back to defaultValue if stored JSON is corrupted", () => {
    localStorage.setItem(TEST_KEY, "NOT_VALID_JSON{{{{");
    const { result } = renderHook(() =>
      useLocalStorageState<string>(TEST_KEY, "fallback")
    );
    expect(result.current[0]).toBe("fallback");
  });
});

describe("useLocalStorageState — setter", () => {
  it("updates state to the new value", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<string>(TEST_KEY, "initial")
    );
    act(() => {
      result.current[1]("updated");
    });
    expect(result.current[0]).toBe("updated");
  });

  it("persists the new value to localStorage as JSON", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<number>(TEST_KEY, 0)
    );
    act(() => {
      result.current[1](99);
    });
    const raw = localStorage.getItem(TEST_KEY);
    expect(raw).toBe("99");
    expect(JSON.parse(raw!)).toBe(99);
  });

  it("persists objects to localStorage as JSON-stringified value", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<{ name: string }>(TEST_KEY, { name: "" })
    );
    act(() => {
      result.current[1]({ name: "Bangalore" });
    });
    const raw = localStorage.getItem(TEST_KEY);
    expect(JSON.parse(raw!)).toEqual({ name: "Bangalore" });
  });

  it("successive calls update both state and localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<number>(TEST_KEY, 0)
    );
    act(() => { result.current[1](1); });
    act(() => { result.current[1](2); });
    act(() => { result.current[1](3); });
    expect(result.current[0]).toBe(3);
    expect(JSON.parse(localStorage.getItem(TEST_KEY)!)).toBe(3);
  });
});
