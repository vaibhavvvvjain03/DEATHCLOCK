export interface CarbonData {
  remainingBudgetTonnes: number;
  annualEmissionRate: number;
  secondsRemaining: number;
  contextSentence: string;
  survivalProbability?: number;
  populationAtRisk?: string;
  annualEmissions?: string;
  threatClass?: string;
  resolvedLocation?: string;
  resolvedCountry?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  burnRate: number;
}

export interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
}

export interface QuestionBank {
  movement: Question[];
  food: Question[];
  home: Question[];
  consumption: Question[];
  waterWaste: Question[];
  work: Question[];
}

export interface SwapMission {
  action: string;
  secondsBack: number;
  difficulty: "easy" | "medium" | "hard";
  localContext: string;
}

export interface SessionData {
  cityName: string;
  carbonData: CarbonData | null;
  allAnswers: Record<string, string>;
  totalBurnRate: number;
  swaps: SwapMission[];
  committedMissions: string[];
  timestamp: number;
}
