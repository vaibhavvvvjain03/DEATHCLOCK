import { NextResponse } from "next/server";
import { getCached } from "../../../lib/cache";
import { POST as CarbonPOST } from "../carbon/route";

const WARMUP_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];
let isWarmingUp = false;

export async function GET() {
  const isWarmedUp = !!getCached(WARMUP_CITIES[0]);

  if (!isWarmedUp && !isWarmingUp) {
    isWarmingUp = true;
    Promise.allSettled(
      WARMUP_CITIES.map(async (city) => {
        const req = new Request("http://localhost/api/carbon", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-forwarded-for": "internal-warmup"
          },
          body: JSON.stringify({ location: city }),
        });
        await CarbonPOST(req);
      })
    ).then(() => {
      isWarmingUp = false;
    }).catch((err) => {
      console.error("Warmup failed:", err);
      isWarmingUp = false;
    });
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "DeathClock Carbon Intelligence",
    warmedUp: isWarmedUp,
    warmingUp: isWarmingUp
  });
}
