import { CarbonData, SwapMission } from "./types";

export const CARBON_CONSTANTS = {
  GLOBAL_BUDGET_TONNES: 4.2e12,
  CRITICAL_TEMP_THRESHOLD: 1.5,
  MAX_CITY_NAME_LENGTH: 100,
  API_TIMEOUT_MS: 10000,
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
} as const;

export const FALLBACK_CARBON_DATA: CarbonData = {
  remainingBudgetTonnes: 656000000,
  annualEmissionRate: 25000000,
  secondsRemaining: 226800000,
  contextSentence: "This city faces significant climate risk at current emission rates.",
  survivalProbability: 47,
  populationAtRisk: "Unknown",
  annualEmissions: "Data unavailable",
  threatClass: "ALPHA-1 CRITICAL",
};

export const FALLBACK_SWAPS: SwapMission[] = [
  {
    action: "Switch to public transit or carpool twice weekly",
    secondsBack: 1200,
    difficulty: "easy",
    localContext: "Check your city's metro or bus rapid transit options",
  },
  {
    action: "Replace one meat meal per day with a plant-based option",
    secondsBack: 800,
    difficulty: "easy",
    localContext: "Dal, rajma, and chana are high-protein, low-carbon alternatives",
  },
  {
    action: "Set AC temperature to 24°C instead of cooling below 22°C",
    secondsBack: 600,
    difficulty: "easy",
    localContext: "Bureau of Energy Efficiency recommends 24°C as optimal setting",
  },
];
