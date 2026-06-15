/**
 * Validates required environment variables exist at startup.
 * Throws a descriptive error if any are missing, so the app fails
 * fast with a clear message rather than a cryptic API error deep
 * in a request handler.
 *
 * IMPORTANT: Only call this inside API route handlers (server-side).
 * Never call from client components.
 */
export function validateEnv(): void {
  const required = ['GEMINI_API_KEY']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    // Log the specifics server-side only — never expose to the client.
    console.error(
      `[env] Missing required environment variables: ${missing.join(', ')}`
    )
    throw new Error('Missing required server environment variables.')
  }
}
