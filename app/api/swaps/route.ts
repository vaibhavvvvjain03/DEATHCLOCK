import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { checkRateLimit } from "../../../lib/rateLimit";
import { CARBON_CONSTANTS, FALLBACK_SWAPS } from "../../../lib/constants";

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
 * Handles POST requests to generate personalized carbon-saving swaps.
 * Uses rate limiting, input sanitization, and strong typing.
 */
export async function POST(request: Request) {
  let cityName = "your city";
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
    if (!body || typeof body.allAnswers !== "object" || typeof body.cityName !== "string" || typeof body.personalDailySeconds !== "number") {
      return NextResponse.json(
        { error: "allAnswers (object), cityName (string), and personalDailySeconds (number) are required." },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize cityName
    cityName = body.cityName.replace(/<[^>]*>/g, ""); // Strip HTML tags
    cityName = cityName.slice(0, CARBON_CONSTANTS.MAX_CITY_NAME_LENGTH); // Limit length
    
    if (!cityName.trim()) {
      return NextResponse.json(
        { error: "cityName cannot be empty after sanitization." },
        { status: 400, headers: securityHeaders }
      );
    }

    const { allAnswers, personalDailySeconds } = body;
    const formattedAllAnswers = JSON.stringify(allAnswers);

    const prompt = `Based on these lifestyle answers for a ${cityName} resident: ${formattedAllAnswers}. Identify exactly 3 behavior swaps that would have the highest carbon impact. For each swap calculate exactly how many seconds it adds back to the city clock per day. Return ONLY valid JSON: { "swaps": [ { "action": string, "secondsBack": number, "difficulty": "easy" | "medium" | "hard", "localContext": string (make this specific to the city, mention local options) } ] }`;

    const resultText = await callGemini(prompt);
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for swaps:", resultText, parseError);
      return NextResponse.json(
        { error: "Failed to parse model response as JSON.", raw: resultText },
        { status: 502, headers: securityHeaders }
      );
    }

    return NextResponse.json(parsedResult, {
      status: 200,
      headers: securityHeaders,
    });
  } catch (error: any) {
    console.error("Error in /api/swaps, falling back to static swaps:", error);
    
    // Create a modified fallback with the sanitized city name
    const localizedFallback = FALLBACK_SWAPS.map(swap => ({
      ...swap,
      localContext: swap.localContext.includes(cityName) 
        ? swap.localContext 
        : `${swap.localContext} in ${cityName}.`
    }));

    return NextResponse.json({
      swaps: localizedFallback
    }, {
      status: 200,
      headers: securityHeaders,
    });
  }
}
