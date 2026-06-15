import { useState, useEffect } from "react";
import { CarbonData } from "@/lib/types";
import { FALLBACK_CARBON_DATA } from "@/lib/constants";

export interface CityDataResult {
  data: CarbonData | null;
  loading: boolean;
  error: string | null;
  isFromFallback: boolean;
}

/**
 * Fetches carbon intelligence data for a given
 * city from /api/carbon, with loading, error, and
 * fallback states. Used on the scanning page to
 * drive the reveal sequence.
 *
 * Preserves the existing 8-second timeout and
 * fallback behavior exactly as originally written.
 */
export function useCityData(cityName: string, isDemo: boolean = false): CityDataResult {
  const [data, setData] = useState<CarbonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromFallback, setIsFromFallback] = useState(false);

  useEffect(() => {
    if (!cityName) return;

    // Reset state whenever cityName changes
    setData(null);
    setLoading(true);
    setError(null);
    setIsFromFallback(false);

    if (isDemo) {
      const fallback: CarbonData = {
        ...FALLBACK_CARBON_DATA,
        cityName: cityName.toUpperCase(),
        contextSentence: "Carbon telemetry is running in DEMO mode.",
      } as CarbonData & { cityName: string };
      setData(fallback);
      localStorage.setItem("dc_data", JSON.stringify(fallback));
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 8000);

    const fetchData = async () => {
      try {
        const res = await fetch("/api/carbon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: cityName }),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const fetched: CarbonData = await res.json();
        setData(fetched);
        localStorage.setItem("dc_data", JSON.stringify(fetched));
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          // Fetch took longer than 8 seconds. Using cached/fallback data.
        } else {
          // Fetch failed
        }
        setError("fetch-failed");
        const fallback: CarbonData = {
          ...FALLBACK_CARBON_DATA,
          cityName: cityName.toUpperCase(),
          contextSentence: "CONNECTION SLOW — USING CACHED DATA",
        } as CarbonData & { cityName: string };
        setData(fallback);
        setIsFromFallback(true);
        localStorage.setItem("dc_data", JSON.stringify(fallback));
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [cityName, isDemo]);

  return { data, loading, error, isFromFallback };
}
