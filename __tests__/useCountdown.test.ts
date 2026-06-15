/**
 * @jest-environment jsdom
 *
 * Tests for hooks/useCountdown.ts
 *
 * Uses jest fake timers to control the setInterval tick without real-clock waits.
 * renderHook from @testing-library/react (React 18+ includes renderHook built-in).
 *
 * Cleanup strategy: afterEach calls unmount() then jest.clearAllTimers() then
 * jest.useRealTimers(). We must NOT call jest.runAllTimers() in afterEach because
 * the setInterval inside useCountdown is indefinite — runAllTimers detects an
 * "infinite loop" (100k iterations). clearAllTimers safely cancels all pending
 * timers without executing them.
 */
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "../hooks/useCountdown";

// The hook uses Math.floor(365.25 * 24 * 3600) as "year in seconds"
const SECONDS_PER_YEAR_FLOOR = Math.floor(365.25 * 24 * 3600); // 31,557,600

// ---------------------------------------------------------------------------
// Initial values — no timer involvement, all synchronous
// ---------------------------------------------------------------------------
describe("useCountdown — initial values", () => {
  it("decomposes 829785600 seconds into the correct years and days", () => {
    const INITIAL = 829785600;
    const { result } = renderHook(() => useCountdown(INITIAL));

    const expectedYrs = Math.floor(INITIAL / SECONDS_PER_YEAR_FLOOR);
    const rem = INITIAL - expectedYrs * SECONDS_PER_YEAR_FLOOR;
    const expectedDays = Math.floor(rem / (24 * 3600));

    expect(result.current.yrs).toBe(expectedYrs);
    expect(result.current.days).toBe(expectedDays);
  });

  it("returns 0 for all fields when initialSeconds is 0", () => {
    const { result } = renderHook(() => useCountdown(0));
    expect(result.current.yrs).toBe(0);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
    expect(result.current.percentRemaining).toBe(0);
  });

  it("formats hh/mm/ss with leading zeros for single-digit values", () => {
    // 3661 seconds = 1 hour, 1 minute, 1 second
    const { result } = renderHook(() => useCountdown(3661));
    expect(result.current.hh).toBe("01");
    expect(result.current.mm).toBe("01");
    expect(result.current.ss).toBe("01");
  });

  it("starts at 100% remaining immediately on mount", () => {
    // On mount: ticks === initialSeconds → (ticks / initialSeconds) * 100 = 100
    const { result } = renderHook(() => useCountdown(1000));
    expect(result.current.percentRemaining).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// percentRemaining calculation — no timer involvement
// ---------------------------------------------------------------------------
describe("useCountdown — percentRemaining", () => {
  it("calculates 0% when initialSeconds is 0", () => {
    const { result } = renderHook(() => useCountdown(0));
    expect(result.current.percentRemaining).toBe(0);
  });

  it("starts at 100% for any positive initial value", () => {
    const { result } = renderHook(() => useCountdown(5000));
    expect(result.current.percentRemaining).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Timer decrement
// Each test manually manages fake timers and calls unmount() + clearAllTimers()
// in cleanup to avoid the infinite-interval runAllTimers problem.
// ---------------------------------------------------------------------------
describe("useCountdown — timer decrement", () => {
  it("decrements the seconds component by 1 after advancing 1 second", () => {
    jest.useFakeTimers();
    // 3601 seconds = 1 hour, 0 minutes, 1 second
    const { result, unmount } = renderHook(() => useCountdown(3601));
    expect(result.current.seconds).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 3600 remaining = 1 hour, 0 minutes, 0 seconds
    expect(result.current.seconds).toBe(0);
    expect(result.current.hours).toBe(1);

    act(() => { unmount(); });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("decrements by exactly 3 after advancing 3 seconds on a small input", () => {
    jest.useFakeTimers();
    // 30 seconds total — all within the seconds component, no decomposition needed
    const { result, unmount } = renderHook(() => useCountdown(30));
    expect(result.current.seconds).toBe(30);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(27);

    act(() => { unmount(); });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("does not decrement below 0 when the clock advances past expiry", () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() => useCountdown(2));

    act(() => {
      jest.advanceTimersByTime(5000); // far past the 2-second total
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.percentRemaining).toBe(0);

    act(() => { unmount(); });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("percentRemaining decreases after each tick", () => {
    jest.useFakeTimers();
    // 10-second countdown — after 1 tick should be 90%
    const { result, unmount } = renderHook(() => useCountdown(10));
    expect(result.current.percentRemaining).toBe(100);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.percentRemaining).toBeLessThan(100);
    expect(result.current.percentRemaining).toBeGreaterThan(0);

    act(() => { unmount(); });
    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
