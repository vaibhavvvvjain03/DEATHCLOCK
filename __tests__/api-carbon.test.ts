/**
 * Integration-style tests for app/api/carbon/route.ts
 *
 * Focuses on the validation layer and fallback behaviour.
 * No real Gemini API calls are made — callGemini is fully mocked.
 *
 * Note: The existing __tests__/api-validation.test.ts already covers
 * many edge cases for both carbon and swaps routes. This file adds
 * targeted coverage for the specific requirements of Pass 8:
 *   - Valid request → 200 with expected response shape
 *   - Invalid cityName → 400
 *   - Gemini failure → 200 with fallback data (not an error)
 */
import { POST as CarbonPOST } from "../app/api/carbon/route";
import { callGemini } from "../lib/gemini";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock("../lib/gemini", () => ({
  callGemini: jest.fn(),
}));

// validateEnv must pass in tests (GEMINI_API_KEY is not set in the test env)
jest.mock("../lib/env", () => ({
  validateEnv: jest.fn(),
}));

let cacheStore: Record<string, unknown> = {};
jest.mock("../lib/cache", () => ({
  getCached: jest.fn((key: string) => cacheStore[key]),
  setCached: jest.fn((key: string, val: unknown) => { cacheStore[key] = val; }),
}));

jest.mock("../lib/rateLimit", () => ({
  checkRateLimit: jest.fn(() => true),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: unknown) {
  return new Request("http://localhost/api/carbon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_CARBON_RESPONSE = {
  cityName: "Bangalore",
  country: "India",
  region: "Karnataka",
  remainingBudgetTonnes: 445000000,
  annualEmissionRate: 28000000,
  secondsRemaining: 502560000,
  contextSentence: "Test sentence.",
  survivalProbability: 47,
  populationAtRisk: "12.7 million",
  annualEmissions: "28.0MT CO₂",
  threatClass: "ALPHA-1 CRITICAL",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/carbon — validation layer", () => {
  beforeEach(() => {
    cacheStore = {};
    (callGemini as jest.Mock).mockReset();
  });

  it("returns 400 with error details for empty location", async () => {
    const res = await CarbonPOST(makeRequest({ location: "" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
    expect(body.details).toBeDefined();
  });

  it("returns 400 for location containing <script>", async () => {
    const res = await CarbonPOST(makeRequest({ location: "<script>alert(1)</script>" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 for location over 100 characters", async () => {
    const res = await CarbonPOST(makeRequest({ location: "A".repeat(101) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when location field is missing", async () => {
    const res = await CarbonPOST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when location is a number instead of string", async () => {
    const res = await CarbonPOST(makeRequest({ location: 42 }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/carbon — successful Gemini response", () => {
  beforeEach(() => {
    cacheStore = {};
    (callGemini as jest.Mock).mockReset();
  });

  it("returns 200 with the expected response shape on a valid request", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce(JSON.stringify(MOCK_CARBON_RESPONSE));

    const res = await CarbonPOST(makeRequest({ location: "Bangalore" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.cityName).toBe("Bangalore");
    expect(body.remainingBudgetTonnes).toBe(445000000);
    expect(body.survivalProbability).toBe(47);
    expect(body.threatClass).toBe("ALPHA-1 CRITICAL");
  });

  it("returns security headers on a 200 response", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce(JSON.stringify(MOCK_CARBON_RESPONSE));

    const res = await CarbonPOST(makeRequest({ location: "Bangalore" }));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("POST /api/carbon — Gemini failure fallback", () => {
  beforeEach(() => {
    cacheStore = {};
    (callGemini as jest.Mock).mockReset();
  });

  it("returns 200 with fallback data (not an error) when Gemini fails", async () => {
    // Both models fail
    (callGemini as jest.Mock)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error again"));

    const res = await CarbonPOST(makeRequest({ location: "Unknown City" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    // Should contain cityName (uppercased from fallback)
    expect(body.cityName).toBeDefined();
    // Should not expose raw error details to the client
    expect(body.error).toBeUndefined();
  });

  it("returns 200 with city-specific fallback when location is a known city", async () => {
    // Both models fail
    (callGemini as jest.Mock)
      .mockRejectedValueOnce(new Error("down"))
      .mockRejectedValueOnce(new Error("down again"));

    const res = await CarbonPOST(makeRequest({ location: "Mumbai" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.cityName).toBe("MUMBAI");
    // Mumbai has 43% survival probability in CITY_FALLBACKS
    expect(body.survivalProbability).toBe(43);
  });

  it("returns 200 with generic fallback for an unknown city when Gemini fails", async () => {
    (callGemini as jest.Mock)
      .mockRejectedValueOnce(new Error("down"))
      .mockRejectedValueOnce(new Error("down again"));

    const res = await CarbonPOST(makeRequest({ location: "Nonexistentcity" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cityName).toBe("NONEXISTENTCITY");
    // Generic fallback has some secondsRemaining
    expect(body.secondsRemaining).toBeDefined();
  });

  it("returns 200 with city fallback when Gemini returns invalid JSON", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce("INVALID{{{JSON");

    const res = await CarbonPOST(makeRequest({ location: "Delhi" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cityName).toBe("DELHI");
  });
});

describe("POST /api/carbon — cache behaviour", () => {
  beforeEach(() => {
    cacheStore = {};
    (callGemini as jest.Mock).mockReset();
  });

  it("returns cached data without calling Gemini when cache is warm", async () => {
    cacheStore["London"] = { cityName: "LONDON_CACHED", secondsRemaining: 999 };

    const res = await CarbonPOST(makeRequest({ location: "London" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cityName).toBe("LONDON_CACHED");
    expect(callGemini).not.toHaveBeenCalled();
  });
});
