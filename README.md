# Deathclock - Classified Intelligence System

This is a Next.js application designed to calculate carbon footprints, assess climate impact, and generate actionable emission reduction strategies using Google's Gemini AI.

## Table of Contents
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Summary of Improvements](#summary-of-improvements)

## Local Setup

First, ensure you have Node.js installed (v18 or higher recommended). Then install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project requires environment variables to access external APIs securely. See `.env.example` for the required keys.

To set up:
1. Copy `.env.example` to `.env.local`
```bash
cp .env.example .env.local
```
2. Open `.env.local` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Security Note:** Never expose `GEMINI_API_KEY` on the client side. Ensure it is never prefixed with `NEXT_PUBLIC_`.

## Testing

Jest and React Testing Library are configured. To run the tests:

```bash
npm run test
```

We test utility functions (e.g., carbon calculation logic) and validate our API route error handling.

## Summary of Improvements

The application has been overhauled for the competition submission with the following upgrades:

### 1. Security (High Impact)
- **API Key Protection:** Audited all routes and `lib/gemini.ts`. Ensured `GEMINI_API_KEY` is completely server-side and `NEXT_PUBLIC_` variables are removed.
- **Input Sanitization:** Stripped HTML tags from all text inputs hitting the API routes. Length caps applied to city names.
- **Rate Limiting:** Implemented IP-based rate limiting (10 requests per 15 minutes) for Gemini endpoints to prevent abuse.
- **Security Headers:** Added `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers to all API responses.

### 2. Code Quality & Maintainability
- **TypeScript & Typing:** Addressed all `any` types. Introduced `CarbonData` and `SwapData` types in `lib/types.ts`.
- **Constants:** Extracted magic strings and numbers into `lib/constants.ts` (e.g., fallback data, rate limits, max lengths).
- **JSDoc:** Documented `callGemini` and API routes.
- **Error Boundaries:** Added a global Next.js Error Boundary to catch render failures gracefully.

### 3. Performance & Architecture
- **Caching:** Added an in-memory cache in `lib/cache.ts` for `/api/carbon` to avoid redundant Gemini calls for the same city within a 24-hour period.
- **Memoization:** Wrapped calculation logic in `useMemo` to prevent unnecessary re-renders in `app/dossier/page.tsx`.
- **Timeouts:** Added an 8-second timeout for the initial scan fetch, falling back to static data cleanly if Gemini hangs.

### 4. Testing & Reliability
- **Jest Setup:** Installed and configured Jest and `ts-jest`.
- **Test Coverage:** Added `carbon-utils.test.ts` to test calculation functions and `api-validation.test.ts` to test API route error codes.
- **Health Check:** Added `/api/health` endpoint for monitoring application uptime.

### 5. Accessibility
- Added a `DEMO MODE` indicator for visibility.
- Configured `.sr-only` screen-reader utilities and `:focus-visible` outlines in `globals.css` to improve keyboard navigation.
