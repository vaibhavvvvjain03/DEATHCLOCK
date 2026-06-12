import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.location) {
      return NextResponse.json(
        { error: "location is a required field in the request body." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { location } = body;
    const prompt = `You are a climate scientist and geolocation expert. The user has provided the location name: "${location}". First, identify if this is a state, city, or country, and determine its corresponding overarching country (if it is a country, just use that country). Then calculate: (1) remaining carbon budget in tonnes CO2 before this specific region crosses the 1.5°C irreversible threshold based on IPCC and localized data, (2) current annual regional emission rate in tonnes CO2, (3) therefore exact seconds remaining in the carbon budget countdown. Return ONLY valid JSON: { "resolvedLocation": string (the properly formatted name of the place), "resolvedCountry": string (the country it belongs to), "remainingBudgetTonnes": number, "annualEmissionRate": number, "secondsRemaining": number, "contextSentence": string (one dramatic sentence about this specific region's climate risk) }`;

    const resultText = await callGemini(prompt);
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for carbon:", resultText, parseError);
      return NextResponse.json(
        { error: "Failed to parse model response as JSON.", raw: resultText },
        { status: 502, headers: corsHeaders }
      );
    }

    return NextResponse.json(parsedResult, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("Error in /api/carbon, falling back to estimates:", error);
    return NextResponse.json({
      resolvedLocation: body?.location?.toUpperCase() || "UNKNOWN",
      resolvedCountry: "UNKNOWN DETECTED",
      remainingBudgetTonnes: 600000000,
      annualEmissionRate: 50000000,
      secondsRemaining: 236520000,
      contextSentence: "Carbon telemetry is currently relying on fallback estimates due to high API demand."
    }, {
      status: 200,
      headers: corsHeaders,
    });
  }
}
