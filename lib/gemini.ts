import { CARBON_CONSTANTS } from "./constants";

/**
 * Shared utility for communicating with the Gemini 3.5 Flash API.
 */

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const timeoutPromise = new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), CARBON_CONSTANTS.API_TIMEOUT_MS)
  );

  const fetchPromise = fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let response: Response;
  try {
    response = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error("Gemini API call failed or timed out:", error);
    throw error;
  }

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch (_) {
      errorText = response.statusText;
    }
    throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response text returned from Gemini API.");
  }

  return text;
}
