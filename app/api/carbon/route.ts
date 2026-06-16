/**
 * CARBON API ROUTE \u2014 POST /api/carbon
 * Accepts a location name, applies rate limiting and caching, then calls
 * the Gemini API to return structured carbon budget data. Falls back to
 * city-specific or generic static data on any failure.
 */
import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCached, setCached } from "../../../lib/cache";
import { CARBON_CONSTANTS, FALLBACK_CARBON_DATA } from "../../../lib/constants";
import { getCityFallback } from "../../../lib/cityFallbacks";
import { carbonRequestSchema } from "../../../lib/schemas";
import { validateEnv } from "../../../lib/env";

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  ...corsHeaders,
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: securityHeaders,
  });
}

/**
 * Handles POST requests to fetch carbon data for a given location.
 * Uses rate limiting, input sanitization, and caching.
 */
export async function POST(request: Request) {
  let requestedLocation = "UNKNOWN";
  try {
    // Fail fast if required env vars are not set
    try {
      validateEnv();
    } catch (envError) {
      console.error("[/api/carbon] Environment validation failed:", envError);
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500, headers: securityHeaders }
      );
    }

    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (!checkRateLimit(ip, CARBON_CONSTANTS.RATE_LIMIT_MAX_REQUESTS, CARBON_CONSTANTS.RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429, headers: securityHeaders }
      );
    }

    const rawBody = await request.json().catch(() => null);

    // Zod schema validation — rejects empty, overlong, or injection-risk values
    const parseResult = carbonRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400, headers: securityHeaders }
      );
    }

    // Use the validated (sanitized) value from this point on
    let location = parseResult.data.location;
    // Additional secondary sanitization: strip any residual HTML tags and trim
    location = location.replace(/<[^>]*>/g, "").trim();
    location = location.slice(0, CARBON_CONSTANTS.MAX_CITY_NAME_LENGTH);
    requestedLocation = location;

    if (!location) {
      return NextResponse.json(
        { error: "location cannot be empty after sanitization." },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check Cache
    const cachedData = getCached(location);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        status: 200,
        headers: securityHeaders,
      });
    }

    const prompt = `For the city ${location}, provide carbon data as JSON only, no other text:
{
  "cityName": string (the city name as provided),
  "country": string (the country this city is in),
  "region": string (state or region),
  "remainingBudgetTonnes": number,
  "annualEmissionRate": number,
  "secondsRemaining": number,
  "contextSentence": string,
  "survivalProbability": number,
  "populationAtRisk": string,
  "annualEmissions": string,
  "threatClass": string
}`;

    // Models tested during development: gemini-1.5-flash, gemini-flash-latest, gemini-2.0-flash, gemini-2.5-flash, gemini-3.5-flash
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let resultText = "";
    
    for (const model of models) {
      try {
        resultText = await callGemini(prompt, model);
        break; // Success
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        continue;
      }
    }
    
    if (!resultText) {
      throw new Error("All Gemini models failed");
    }
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for carbon:", resultText, parseError);
      throw new Error("Failed to parse model response as JSON.");
    }

    // Save to Cache
    setCached(location, parsedResult);

    return NextResponse.json(parsedResult, {
      status: 200,
      headers: securityHeaders,
    });
  } catch (error: unknown) {
    console.error("Error in /api/carbon, falling back to estimates:", error);
    
    const locStr = requestedLocation;

    // 1. Try city-specific fallback first
    const cityFallback = getCityFallback(locStr);
    if (cityFallback) {
      return NextResponse.json({
        cityName: locStr.toUpperCase(),
        ...cityFallback
      }, {
        status: 200,
        headers: securityHeaders,
      });
    }

    // 2. Otherwise use generic fallback
    return NextResponse.json({
      cityName: locStr.toUpperCase(),
      ...FALLBACK_CARBON_DATA
    }, {
      status: 200,
      headers: securityHeaders,
    });
  }
}
