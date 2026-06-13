import { CarbonData } from "./types";

export const CITY_FALLBACKS: Record<string, CarbonData> = {
  'mumbai': {
    remainingBudgetTonnes: 656300000,
    annualEmissionRate: 25000000,
    secondsRemaining: 829785600,
    contextSentence: "Mumbai's coastal position makes it extremely vulnerable to sea level rise as its carbon budget depletes.",
    survivalProbability: 43,
    populationAtRisk: "20.7 million",
    annualEmissions: "25.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'delhi': {
    remainingBudgetTonnes: 892000000,
    annualEmissionRate: 38000000,
    secondsRemaining: 743904000,
    contextSentence: "Delhi's air quality crisis will become permanent as temperatures breach the 1.5C threshold.",
    survivalProbability: 38,
    populationAtRisk: "32.9 million",
    annualEmissions: "38.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'bangalore': {
    remainingBudgetTonnes: 445000000,
    annualEmissionRate: 28000000,
    secondsRemaining: 502560000,
    contextSentence: "Bangalore's rapid tech expansion drives energy demand that threatens to exhaust its carbon runway.",
    survivalProbability: 47,
    populationAtRisk: "12.7 million",
    annualEmissions: "28.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'chennai': {
    remainingBudgetTonnes: 312000000,
    annualEmissionRate: 18000000,
    secondsRemaining: 548640000,
    contextSentence: "Chennai faces acute water scarcity risk as climate thresholds approach faster than mitigation efforts.",
    survivalProbability: 51,
    populationAtRisk: "10.9 million",
    annualEmissions: "18.0MT CO₂",
    threatClass: "BETA-2 SEVERE"
  },
  'hyderabad': {
    remainingBudgetTonnes: 378000000,
    annualEmissionRate: 21000000,
    secondsRemaining: 568512000,
    contextSentence: "Hyderabad's tech corridor expansion is outpacing its renewable energy transition capacity.",
    survivalProbability: 49,
    populationAtRisk: "10.5 million",
    annualEmissions: "21.0MT CO₂",
    threatClass: "BETA-2 SEVERE"
  },
  'kolkata': {
    remainingBudgetTonnes: 298000000,
    annualEmissionRate: 16000000,
    secondsRemaining: 589680000,
    contextSentence: "Kolkata faces extreme flooding risk as Bengal delta sea levels rise with global temperature breach.",
    survivalProbability: 41,
    populationAtRisk: "14.8 million",
    annualEmissions: "16.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'pune': {
    remainingBudgetTonnes: 289000000,
    annualEmissionRate: 14000000,
    secondsRemaining: 651888000,
    contextSentence: "Pune's manufacturing belt generates disproportionate emissions relative to its population size.",
    survivalProbability: 54,
    populationAtRisk: "7.4 million",
    annualEmissions: "14.0MT CO₂",
    threatClass: "BETA-2 SEVERE"
  },
  'london': {
    remainingBudgetTonnes: 445000000,
    annualEmissionRate: 32000000,
    secondsRemaining: 439344000,
    contextSentence: "London's financial sector carbon footprint rivals its entire transport network combined.",
    survivalProbability: 58,
    populationAtRisk: "9.5 million",
    annualEmissions: "32.0MT CO₂",
    threatClass: "GAMMA-3 HIGH"
  },
  'new york': {
    remainingBudgetTonnes: 892000000,
    annualEmissionRate: 54000000,
    secondsRemaining: 521856000,
    contextSentence: "New York's coastal infrastructure faces permanent inundation risk within this carbon budget window.",
    survivalProbability: 44,
    populationAtRisk: "18.8 million",
    annualEmissions: "54.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'beijing': {
    remainingBudgetTonnes: 1240000000,
    annualEmissionRate: 87000000,
    secondsRemaining: 449856000,
    contextSentence: "Beijing's coal dependency makes it one of the highest per-capita carbon risk cities globally.",
    survivalProbability: 32,
    populationAtRisk: "21.7 million",
    annualEmissions: "87.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  },
  'karnataka': {
    remainingBudgetTonnes: 1200000000,
    annualEmissionRate: 65000000,
    secondsRemaining: 583200000,
    contextSentence: "Karnataka's energy mix remains coal-dependent despite significant solar potential going untapped.",
    survivalProbability: 48,
    populationAtRisk: "67.6 million",
    annualEmissions: "65.0MT CO₂",
    threatClass: "BETA-2 SEVERE"
  },
  'maharashtra': {
    remainingBudgetTonnes: 2100000000,
    annualEmissionRate: 112000000,
    secondsRemaining: 592704000,
    contextSentence: "Maharashtra's industrial belt is the single largest contributor to India's regional carbon deficit.",
    survivalProbability: 41,
    populationAtRisk: "126 million",
    annualEmissions: "112.0MT CO₂",
    threatClass: "ALPHA-1 CRITICAL"
  }
}

export function getCityFallback(cityName: string): CarbonData | null {
  return CITY_FALLBACKS[cityName.toLowerCase()] || null;
}
