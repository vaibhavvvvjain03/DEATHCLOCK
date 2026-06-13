import { POST as CarbonPOST } from "../app/api/carbon/route";
import { POST as SwapsPOST } from "../app/api/swaps/route";
import { CARBON_CONSTANTS } from "../lib/constants";

describe("API Validation", () => {
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
});
