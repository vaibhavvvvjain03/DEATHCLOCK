import { z } from 'zod'

/**
 * Validates the request body for /api/carbon.
 * The route expects a `location` field (city name).
 * Limited to 100 chars and restricted to letters, spaces,
 * hyphens, commas, and periods to prevent injection.
 */
export const carbonRequestSchema = z.object({
  location: z.string().min(1).max(100)
    .regex(/^[a-zA-Z\s\-,.]+$/, 'Invalid characters in city name')
})

/**
 * Validates the request body for /api/swaps.
 * Matches the actual field names used by the swaps route handler.
 */
export const swapsRequestSchema = z.object({
  cityName: z.string().min(1).max(100)
    .regex(/^[a-zA-Z\s\-,.]+$/, 'Invalid characters in city name'),
  personalDailySeconds: z.number(),
  allAnswers: z.record(z.string(), z.array(z.string()))
})
