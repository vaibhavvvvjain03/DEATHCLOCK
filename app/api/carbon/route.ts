import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCached, setCached } from "../../../lib/cache";
import { CARBON_CONSTANTS, FALLBACK_CARBON_DATA } from "../../../lib/constants";
import { getCityFallback } from "../../../lib/cityFallbacks";

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
    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (!checkRateLimit(ip, CARBON_CONSTANTS.RATE_LIMIT_MAX_REQUESTS, CARBON_CONSTANTS.RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429, headers: securityHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.location !== "string") {
      return NextResponse.json(
        { error: "location is a required string field in the request body." },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize input
    let location = body.location;
    location = location.replace(/<[^>]*>/g, ""); // Strip HTML tags
    location = location.slice(0, CARBON_CONSTANTS.MAX_CITY_NAME_LENGTH); // Limit length
    requestedLocation = location;
    
    if (!location.trim()) {
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
  } catch (error: any) {
    console.error("Error in /api/carbon, falling back to estimates:", error);
    
    let locStr = requestedLocation;

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
