import { CarbonData } from "./types";

interface CacheEntry {
  data: CarbonData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Gets cached CarbonData for a given key
 * @param key - The cache key (usually the city name)
 * @returns Cached CarbonData or null if not found/expired
 */
export function getCached(key: string): CarbonData | null {
  const entry = cache.get(key.toLowerCase());
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key.toLowerCase());
    return null;
  }
  return entry.data;
}

/**
 * Caches CarbonData for a given key
 * @param key - The cache key (usually the city name)
 * @param data - The CarbonData to cache
 */
export function setCached(key: string, data: CarbonData): void {
  cache.set(key.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
}
