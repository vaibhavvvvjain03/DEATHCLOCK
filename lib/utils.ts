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
