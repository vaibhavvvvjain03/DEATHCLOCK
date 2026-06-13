import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCached, setCached } from "../../../lib/cache";
import { CARBON_CONSTANTS, FALLBACK_CARBON_DATA } from "../../../lib/constants";

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

    const prompt = `You are a climate scientist and geolocation expert. The user has provided the location name: "${location}". First, identify if this is a state, city, or country, and determine its corresponding overarching country (if it is a country, just use that country). Then calculate: (1) remaining carbon budget in tonnes CO2 before this specific region crosses the ${CARBON_CONSTANTS.CRITICAL_TEMP_THRESHOLD}°C irreversible threshold based on IPCC and localized data, (2) current annual regional emission rate in tonnes CO2, (3) therefore exact seconds remaining in the carbon budget countdown. Return ONLY valid JSON: { "resolvedLocation": string (the properly formatted name of the place), "resolvedCountry": string (the country it belongs to), "remainingBudgetTonnes": number, "annualEmissionRate": number, "secondsRemaining": number, "contextSentence": string (one dramatic sentence about this specific region's climate risk) }`;

    const resultText = await callGemini(prompt);
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for carbon:", resultText, parseError);
      return NextResponse.json(
        { error: "Failed to parse model response as JSON.", raw: resultText },
        { status: 502, headers: securityHeaders }
      );
    }

    // Save to Cache
    setCached(location, parsedResult);

    return NextResponse.json(parsedResult, {
      status: 200,
      headers: securityHeaders,
    });
  } catch (error: any) {
    console.error("Error in /api/carbon, falling back to estimates:", error);
    
    // We try to extract location if possible, otherwise UNKNOWN
    let locStr = "UNKNOWN";
    try {
      // In case body was partially parsed
      const maybeBody = await request.clone().json().catch(() => null);
      if (maybeBody && maybeBody.location) locStr = maybeBody.location;
    } catch (e) {}

    return NextResponse.json({
      resolvedLocation: locStr.toUpperCase(),
      resolvedCountry: "UNKNOWN DETECTED",
      ...FALLBACK_CARBON_DATA
    }, {
      status: 200,
      headers: securityHeaders,
    });
  }
}
