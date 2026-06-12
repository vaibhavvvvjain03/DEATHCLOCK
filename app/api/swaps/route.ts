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
  let cityName = "your city";
  try {
    const body = await request.json().catch(() => null);
    if (!body || body.allAnswers === undefined || !body.cityName || body.personalDailySeconds === undefined) {
      return NextResponse.json(
        { error: "allAnswers, cityName, and personalDailySeconds are required fields in the request body." },
        { status: 400, headers: corsHeaders }
      );
    }

    cityName = body.cityName;
    const { allAnswers, personalDailySeconds } = body;
    const formattedAllAnswers = typeof allAnswers === "object" ? JSON.stringify(allAnswers) : allAnswers;

    const prompt = `Based on these lifestyle answers for a ${cityName} resident: ${formattedAllAnswers}. Identify exactly 3 behavior swaps that would have the highest carbon impact. For each swap calculate exactly how many seconds it adds back to the city clock per day. Return ONLY valid JSON: { "swaps": [ { "action": string, "secondsBack": number, "difficulty": "easy" | "medium" | "hard", "localContext": string (make this specific to the city, mention local options) } ] }`;

    const resultText = await callGemini(prompt);
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for swaps:", resultText, parseError);
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
    console.error("Error in /api/swaps, falling back to static swaps:", error);
    return NextResponse.json({
      swaps: [
        {
          action: "Switch to a renewable energy provider",
          secondsBack: 15000,
          difficulty: "medium",
          localContext: `Look for local green energy co-ops in ${cityName}.`
        },
        {
          action: "Reduce red meat consumption to once a week",
          secondsBack: 8000,
          difficulty: "easy",
          localContext: `Explore the local plant-based food scene in ${cityName}.`
        },
        {
          action: "Replace 3 car trips a week with transit or biking",
          secondsBack: 5000,
          difficulty: "medium",
          localContext: `Utilize the public transit network in ${cityName} for regular commutes.`
        }
      ]
    }, {
      status: 200,
      headers: corsHeaders,
    });
  }
}
