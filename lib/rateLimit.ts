/**
 * Simple in-memory rate limiter
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if the given identifier has exceeded the rate limit.
 * @param identifier - Unique ID for the client (e.g. IP address)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
