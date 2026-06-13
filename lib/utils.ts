import { QUESTION_BANK, CATEGORY_KEYS } from "./questions";

/**
 * Calculates personal carbon burn rate from
 * questionnaire answers using IPCC emission factors
 * @param answers - Object containing category answers
 * @returns Total burn rate in seconds per day
 */
export function calculateBurnRate(answers: Record<string, string>): number {
  let score = 0;
  CATEGORY_KEYS.forEach(key => {
    QUESTION_BANK[key].forEach(q => {
      const selectedVal = answers[q.id];
      if (selectedVal) {
        const option = q.options.find(o => o.value === selectedVal);
        if (option) {
          score += option.burnRate;
        }
      }
    });
  });
  return score;
}

export function getThreatLevel(burnRate: number) {
  if (burnRate > 8000) return "OMEGA-0 TERMINAL";
  if (burnRate > 5000) return "ALPHA-1 CRITICAL";
  if (burnRate > 2000) return "BETA-2 CONCERNING";
  if (burnRate > 500) return "GAMMA-3 ELEVATED";
  return "DELTA-4 STABLE";
}

import { ClimateProfile } from "./memory-service";

export function generateArchiveMetrics(profile: ClimateProfile | null) {
  const recoverySources: { category: string; delta: number }[] = [];
  let behaviorChanges: string[] = [];
  
  if (profile && profile.pastInvestigations && profile.pastInvestigations.length > 0) {
    const lastInv = profile.pastInvestigations[profile.pastInvestigations.length - 1];
    
    CATEGORY_KEYS.forEach(key => {
      const oldScore = lastInv.categoryScores?.[key] || 0;
      const newScore = profile.categoryScores?.[key] || 0;
      const delta = oldScore - newScore;
      if (delta > 0) {
        recoverySources.push({ category: key.toUpperCase(), delta });
      }
    });
    recoverySources.sort((a, b) => b.delta - a.delta);

    if (lastInv.answers && profile.answers) {
      CATEGORY_KEYS.forEach(key => {
        QUESTION_BANK[key].forEach(q => {
          const oldVal = lastInv.answers[q.id];
          const newVal = profile.answers[q.id];
          if (oldVal && newVal && oldVal !== newVal) {
            const oldOpt = q.options.find(o => o.value === oldVal);
            const newOpt = q.options.find(o => o.value === newVal);
            if (oldOpt && newOpt && newOpt.burnRate < oldOpt.burnRate) {
              let phrase = q.question + " IMPROVED";
              if (q.id === "mov_2") phrase = "COMMUTE DISTANCE REDUCED";
              if (q.id === "mov_1" && newVal === "public_transit") phrase = "PUBLIC TRANSIT USAGE INCREASED";
              if (q.id === "food_2") phrase = "RED MEAT CONSUMPTION REDUCED";
              if (q.id === "home_2" || q.id === "home_4") phrase = "HOME ENERGY EFFICIENCY IMPROVED";
              if (q.id === "mov_3") phrase = "FLIGHT FREQUENCY REDUCED";
              if (q.id === "food_4") phrase = "FOOD WASTE REDUCED";
              if (q.id === "cons_1") phrase = "APPAREL ACQUISITION REDUCED";
              if (q.id === "cons_4") phrase = "SINGLE-USE PLASTIC REDUCED";
              behaviorChanges.push(phrase);
            }
          }
        });
      });
      behaviorChanges = Array.from(new Set(behaviorChanges));
    }
  }
  return { recoverySources, behaviorChanges };
}
