import { getCityFallback, CITY_FALLBACKS } from "../lib/cityFallbacks";

describe("getCityFallback", () => {
  it("returns Mumbai fallback data for 'mumbai' (lowercase)", () => {
    const result = getCityFallback("mumbai");
    expect(result).not.toBeNull();
    expect(result!.populationAtRisk).toBe("20.7 million");
    expect(result!.threatClass).toBe("ALPHA-1 CRITICAL");
  });

  it("is case-insensitive — 'Bangalore' matches the lowercase key 'bangalore'", () => {
    const result = getCityFallback("Bangalore");
    expect(result).not.toBeNull();
    expect(result!.populationAtRisk).toBe("12.7 million");
    expect(result!.secondsRemaining).toBe(502560000);
  });

  it("is case-insensitive — 'DELHI' matches 'delhi'", () => {
    const result = getCityFallback("DELHI");
    expect(result).not.toBeNull();
    expect(result!.survivalProbability).toBe(38);
  });

  it("returns null for an unknown city", () => {
    expect(getCityFallback("unknown-city-xyz")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(getCityFallback("")).toBeNull();
  });

  it("returns correct survivalProbability for Mumbai", () => {
    const result = getCityFallback("Mumbai");
    expect(result!.survivalProbability).toBe(43);
  });

  it("returns correct annualEmissions for London", () => {
    const result = getCityFallback("London");
    expect(result).not.toBeNull();
    expect(result!.annualEmissions).toBe("32.0MT CO₂");
  });

  it("CITY_FALLBACKS map has expected city keys", () => {
    const keys = Object.keys(CITY_FALLBACKS);
    expect(keys).toContain("mumbai");
    expect(keys).toContain("delhi");
    expect(keys).toContain("bangalore");
    expect(keys).toContain("london");
    expect(keys).toContain("beijing");
  });

  it("each fallback entry has all required CarbonData fields", () => {
    const requiredFields = [
      "remainingBudgetTonnes",
      "annualEmissionRate",
      "secondsRemaining",
      "contextSentence",
      "survivalProbability",
      "populationAtRisk",
      "annualEmissions",
      "threatClass",
    ];
    Object.entries(CITY_FALLBACKS).forEach(([city, data]) => {
      requiredFields.forEach(field => {
        expect(Object.prototype.hasOwnProperty.call(data, field)).toBe(true);
      });
    });
  });
});
