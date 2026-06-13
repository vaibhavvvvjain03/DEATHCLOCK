import { POST as CarbonPOST, OPTIONS as CarbonOPTIONS } from "../app/api/carbon/route";
import { POST as SwapsPOST, OPTIONS as SwapsOPTIONS } from "../app/api/swaps/route";
import { callGemini } from "../lib/gemini";

jest.mock("../lib/gemini", () => ({
  callGemini: jest.fn()
}));

let cacheStore: Record<string, unknown> = {};
jest.mock("../lib/cache", () => ({
  getCached: jest.fn((key) => cacheStore[key]),
  setCached: jest.fn((key, val) => { cacheStore[key] = val; })
}));

import { checkRateLimit } from "../lib/rateLimit";

jest.mock("../lib/rateLimit", () => ({
  checkRateLimit: jest.fn(() => true)
}));

describe("API Validation", () => {
  beforeEach(() => {
    cacheStore = {};
    (callGemini as jest.Mock).mockReset();
    (checkRateLimit as jest.Mock).mockReturnValue(true);
  });

  it("carbon API returns 429 when rate limited", async () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce(false);
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "City" }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await CarbonPOST(req);
    expect(res.status).toBe(429);
  });

  it("swaps API returns 429 when rate limited", async () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce(false);
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "City", allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await SwapsPOST(req);
    expect(res.status).toBe(429);
  });

  it("carbon API handles OPTIONS request", async () => {
    const res = await CarbonOPTIONS();
    expect(res.status).toBe(204);
  });

  it("swaps API handles OPTIONS request", async () => {
    const res = await SwapsOPTIONS();
    expect(res.status).toBe(204);
  });

  it("swaps API returns 400 for empty cityName after sanitization", async () => {
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "<script></script>", allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await SwapsPOST(req);
    expect(res.status).toBe(400);
  });

  it("carbon API returns 400 for empty location", async () => {
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "" }),
      headers: { "Content-Type": "application/json" }
    });
    
    const res = await CarbonPOST(req);
    expect(res.status).toBe(400);
  });

  it("carbon API returns 400 for missing location", async () => {
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ other: "value" }),
      headers: { "Content-Type": "application/json" }
    });
    
    const res = await CarbonPOST(req);
    expect(res.status).toBe(400);
  });

  it("swaps API returns 400 for missing allAnswers", async () => {
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "Mumbai", personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    
    const res = await SwapsPOST(req);
    expect(res.status).toBe(400);
  });

  it("swaps API returns 400 for invalid cityName", async () => {
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    
    const res = await SwapsPOST(req);
    expect(res.status).toBe(400);
  });

  it("carbon API successfully parses gemini response", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce(JSON.stringify({ cityName: "TEST_CITY", remainingBudgetTonnes: 100 }));
    
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "Valid City" }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await CarbonPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cityName).toBe("TEST_CITY");
  });

  it("carbon API handles gemini failure with fallback", async () => {
    (callGemini as jest.Mock).mockRejectedValueOnce(new Error("Gemini down"));
    (callGemini as jest.Mock).mockRejectedValueOnce(new Error("Gemini down again")); // second model
    
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "Fallback City" }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await CarbonPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cityName).toBe("FALLBACK CITY"); // generic fallback or city fallback
  });

  it("carbon API handles invalid gemini JSON with fallback", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce("INVALID JSON");
    
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "Mumbai" }), // Has city fallback
      headers: { "Content-Type": "application/json" }
    });
    const res = await CarbonPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cityName).toBe("MUMBAI");
  });

  it("carbon API uses cache if available", async () => {
    cacheStore["Cached City"] = { cityName: "CACHED_CITY" };
    const req = new Request("http://localhost/api/carbon", {
      method: "POST",
      body: JSON.stringify({ location: "Cached City" }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await CarbonPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cityName).toBe("CACHED_CITY");
    expect(callGemini).not.toHaveBeenCalled();
  });

  it("swaps API successfully parses gemini response", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce(JSON.stringify({ swaps: [{ action: "TEST SWAP" }] }));
    
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "Valid City", allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await SwapsPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.swaps[0].action).toBe("TEST SWAP");
  });

  it("swaps API handles invalid gemini JSON with 502", async () => {
    (callGemini as jest.Mock).mockResolvedValueOnce("INVALID JSON");
    
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "Valid City", allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await SwapsPOST(req);
    expect(res.status).toBe(502);
  });

  it("swaps API handles gemini failure with fallback", async () => {
    (callGemini as jest.Mock).mockRejectedValueOnce(new Error("Gemini down"));
    
    const req = new Request("http://localhost/api/swaps", {
      method: "POST",
      body: JSON.stringify({ cityName: "Valid City", allAnswers: {}, personalDailySeconds: 100 }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await SwapsPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.swaps.length).toBeGreaterThan(0);
  });
});
