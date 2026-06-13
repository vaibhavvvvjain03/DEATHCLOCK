/**
 * @jest-environment node
 */
import { MemoryService } from "../lib/memory-service";

describe("Memory System SSR", () => {
  const baseProfile = {
    city: "CHENNAI",
    answers: {},
    personalBurnRate: 1200,
    categoryScores: {},
    missions: [],
    verdict: "TEST",
    totalInvestigations: 1,
    pastInvestigations: []
  };

  const baseProgress = {
    city: "MUMBAI",
    qIdx: 2,
    catIdx: 0,
    answers: { mov_1: "walk" },
    totalBurnRate: 0
  };

  it("safely returns null/void in SSR environment for getProfile", () => {
    expect(typeof window).toBe("undefined");
    expect(MemoryService.getProfile()).toBeNull();
  });

  it("safely returns null/void in SSR environment for saveProfile", () => {
    expect(() => {
      MemoryService.saveProfile(baseProfile);
    }).not.toThrow();
  });

  it("safely returns null/void in SSR environment for getAuditProgress", () => {
    expect(MemoryService.getAuditProgress()).toBeNull();
  });

  it("safely returns null/void in SSR environment for saveAuditProgress", () => {
    expect(() => {
      MemoryService.saveAuditProgress(baseProgress);
    }).not.toThrow();
  });

  it("safely returns null/void in SSR environment for clearAuditProgress", () => {
    expect(() => {
      MemoryService.clearAuditProgress();
    }).not.toThrow();
  });
});
