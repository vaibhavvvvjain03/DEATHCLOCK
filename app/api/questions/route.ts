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
    if (!body || body.previousAnswers === undefined || !body.cityName) {
      return NextResponse.json(
        { error: "previousAnswers and cityName are required fields in the request body." },
        { status: 400, headers: corsHeaders }
      );
    }

    cityName = body.cityName;
    const { previousAnswers } = body;
    const formattedPreviousAnswers = typeof previousAnswers === "object" ? JSON.stringify(previousAnswers) : previousAnswers;

    const prompt = `You are an AI conducting a dynamic carbon audit for a resident of ${cityName}. 
Here is the history of what has already been asked and answered: ${formattedPreviousAnswers}.
CRITICAL RULES:
1. DO NOT ask a question that is similar to any previous question.
2. You must seamlessly change the topic/category based on the flow of the conversation.
3. Incorporate actual known facts about ${cityName}'s infrastructure (e.g., local transit systems, local weather) into the question.
4. Provide exactly 4 distinct, highly specific multiple-choice options for the user.
Return ONLY JSON: { question: string, options: [string, string, string, string], personalDailySeconds: number, categoryShift: string }`;

    const resultText = await callGemini(prompt);
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON for questions:", resultText, parseError);
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
    console.error("Error in /api/questions, falling back to static questions:", error);
    // Return a fallback question so the questionnaire can proceed when hitting rate limits (429) or high demand (503)
    return NextResponse.json({
      question: `Since our telemetry link for ${cityName} is unstable, let's estimate: How do you primarily travel within your city?`,
      options: [
        "Walking or using a personal bicycle",
        "Public bus, tram, or local metro lines",
        "Ride-sharing or auto-rickshaws",
        "Driving a personal gasoline vehicle"
      ],
      personalDailySeconds: 4500,
      categoryShift: "Fallback"
    }, {
      status: 200,
      headers: corsHeaders,
    });
  }
}
