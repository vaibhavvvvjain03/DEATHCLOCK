import { calculateBurnRate, getThreatLevel, generateArchiveMetrics } from "../lib/utils";
import { MemoryService } from "../lib/memory-service";

describe("Carbon Calculation System", () => {
  it("calculates positive burn rate correctly", () => {
    const answers = { mov_1: "personal_vehicle", mov_2: "over_25" };
    const score = calculateBurnRate(answers);
    // mov_1: 800, mov_2: 500 => 1300
    expect(score).toBe(1300);
  });

  it("calculates negative burn rate for renewable energy", () => {
    const answers = { home_4: "solar" };
    expect(calculateBurnRate(answers)).toBe(-200);
  });

  it("handles missing answers safely", () => {
    const answers = { unknown_question: "walk", mov_1: "" };
    expect(calculateBurnRate(answers)).toBe(0);
  });
});

describe("Threat Classification System", () => {
  it("classifies OMEGA-0 TERMINAL", () => {
    expect(getThreatLevel(8500)).toBe("OMEGA-0 TERMINAL");
  });
  it("classifies ALPHA-1 CRITICAL", () => {
    expect(getThreatLevel(6000)).toBe("ALPHA-1 CRITICAL");
  });
  it("classifies BETA-2 CONCERNING", () => {
    expect(getThreatLevel(3000)).toBe("BETA-2 CONCERNING");
  });
  it("classifies GAMMA-3 ELEVATED", () => {
    expect(getThreatLevel(1000)).toBe("GAMMA-3 ELEVATED");
  });
  it("classifies DELTA-4 STABLE", () => {
    expect(getThreatLevel(400)).toBe("DELTA-4 STABLE");
  });
});

describe("Archive System", () => {
  it("generates archive metrics based on past investigations", () => {
    const profile = {
      pastInvestigations: [
        {
          categoryScores: { movement: 1300 },
          answers: { mov_1: "personal_vehicle" }
        }
      ],
      categoryScores: { movement: 150 },
      answers: { mov_1: "public_transit" }
    };
    const result = generateArchiveMetrics(profile);
    expect(result.recoverySources).toEqual([
      { category: "MOVEMENT", delta: 1150 }
    ]);
    expect(result.behaviorChanges).toContain("PUBLIC TRANSIT USAGE INCREASED");
  });

  it("handles empty profile", () => {
    const result = generateArchiveMetrics(null);
    expect(result.recoverySources).toEqual([]);
    expect(result.behaviorChanges).toEqual([]);
  });
});

