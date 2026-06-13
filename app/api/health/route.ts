export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "DeathClock Carbon Intelligence",
  });
}
