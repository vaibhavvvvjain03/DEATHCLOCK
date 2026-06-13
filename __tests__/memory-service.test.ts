import { MemoryService } from "../lib/memory-service";

describe("Memory System", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    } as unknown as Storage;
    
    Object.defineProperty(global, "window", {
      value: { localStorage: mockLocalStorage },
      writable: true,
    });
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Climate Profile", () => {
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

    it("saves and retrieves climate profile correctly", () => {
      MemoryService.saveProfile(baseProfile);
      const retrieved = MemoryService.getProfile();
      expect(retrieved?.city).toBe("CHENNAI");
      expect(retrieved?.personalBurnRate).toBe(1200);
      expect(retrieved?.version).toBe(1);
      expect(retrieved?.lastVisitDate).toBeDefined();
    });

    it("handles empty storage", () => {
      const retrieved = MemoryService.getProfile();
      expect(retrieved).toBeNull();
    });

    it("handles corrupted localStorage data (invalid JSON)", () => {
      global.localStorage.setItem("dc_climate_profile", "INVALID JSON {");
      const retrieved = MemoryService.getProfile();
      expect(retrieved).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Corrupted climate profile in storage.");
    });

    it("handles save failures safely", () => {
      // Simulate quota exceeded
      jest.spyOn(global.localStorage, "setItem").mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      expect(() => {
        MemoryService.saveProfile(baseProfile);
      }).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it("handles schema version mismatch without crashing", () => {
      const wrongVersionData = {
        version: 999, // Unknown version
        city: "FUTURE CITY",
        answers: {},
        personalBurnRate: 1500,
        categoryScores: {},
        missions: [],
        verdict: "TEST",
        totalInvestigations: 1,
        lastVisitDate: new Date().toISOString()
      };
      global.localStorage.setItem("dc_climate_profile", JSON.stringify(wrongVersionData));
      
      const retrieved = MemoryService.getProfile();
      // Right now the code doesn't do anything special, just returns the parsed profile
      // But we want to cover the branch if (parsed.version !== SCHEMA_VERSION)
      expect(retrieved?.version).toBe(999);
      expect(retrieved?.city).toBe("FUTURE CITY");
    });

    it("handles migration from previousInvestigation to pastInvestigations", () => {
      const legacyData = {
        version: 1,
        city: "OLD CITY",
        answers: {},
        personalBurnRate: 1500,
        categoryScores: {},
        missions: [],
        verdict: "TEST",
        totalInvestigations: 1,
        lastVisitDate: new Date().toISOString(),
        previousInvestigation: {
          city: "OLD CITY",
          burnRate: 1800,
          completionDate: "2026-01-01T00:00:00Z"
        }
      };
      global.localStorage.setItem("dc_climate_profile", JSON.stringify(legacyData));
      
      const retrieved = MemoryService.getProfile();
      expect(retrieved?.pastInvestigations).toBeDefined();
      expect(retrieved?.pastInvestigations.length).toBe(1);
      expect(retrieved?.pastInvestigations[0].id).toBe("INV-001");
      expect(retrieved?.pastInvestigations[0].city).toBe("OLD CITY");
      expect(retrieved?.pastInvestigations[0].burnRate).toBe(1800);
      // Ensure the old property is deleted
      expect((retrieved as Record<string, unknown>).previousInvestigation).toBeUndefined();
    });

    it("ensures pastInvestigations array exists if missing completely", () => {
      const noHistoryData = {
        version: 1,
        city: "NEW CITY",
        answers: {},
        personalBurnRate: 1500,
        categoryScores: {},
        missions: [],
        verdict: "TEST",
        totalInvestigations: 1,
        lastVisitDate: new Date().toISOString()
        // No pastInvestigations, no previousInvestigation
      };
      global.localStorage.setItem("dc_climate_profile", JSON.stringify(noHistoryData));
      
      const retrieved = MemoryService.getProfile();
      expect(retrieved?.pastInvestigations).toBeDefined();
      expect(Array.isArray(retrieved?.pastInvestigations)).toBe(true);
      expect(retrieved?.pastInvestigations.length).toBe(0);
    });

    it("updates last visit date", () => {
      MemoryService.saveProfile(baseProfile);
      const beforeDate = MemoryService.getProfile()?.lastVisitDate;
      
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15T00:00:00Z"));
      MemoryService.updateLastVisit();
      
      const afterDate = MemoryService.getProfile()?.lastVisitDate;
      expect(afterDate).not.toBe(beforeDate);
      expect(afterDate).toBe("2026-06-15T00:00:00.000Z");
      jest.useRealTimers();
    });

    it("returns safely if window is undefined (SSR) for getProfile", () => {
      const origWindow = global.window;
      // @ts-expect-error - testing SSR window behavior
      delete global.window;
      expect(MemoryService.getProfile()).toBeNull();
      global.window = origWindow;
    });

    it("returns safely if window is undefined (SSR) for saveProfile", () => {
      const origWindow = global.window;
      // @ts-expect-error - testing SSR window behavior
      delete global.window;
      expect(() => {
        MemoryService.saveProfile(baseProfile);
      }).not.toThrow();
      global.window = origWindow;
    });

    it("does not update last visit if profile is missing", () => {
      MemoryService.updateLastVisit();
      // Should not throw or crash
      expect(store["dc_climate_profile"]).toBeUndefined();
    });
  });

  describe("Audit Progress", () => {
    const baseProgress = {
      city: "MUMBAI",
      qIdx: 2,
      catIdx: 0,
      answers: { mov_1: "walk" },
      totalBurnRate: 0
    };

    it("saves and retrieves audit progress", () => {
      MemoryService.saveAuditProgress(baseProgress);
      const retrieved = MemoryService.getAuditProgress();
      expect(retrieved?.city).toBe("MUMBAI");
      expect(retrieved?.qIdx).toBe(2);
      expect(retrieved?.version).toBe(1);
    });

    it("clears audit progress", () => {
      MemoryService.saveAuditProgress(baseProgress);
      MemoryService.clearAuditProgress();
      expect(MemoryService.getAuditProgress()).toBeNull();
    });

    it("handles corrupted audit progress data (invalid JSON)", () => {
      global.localStorage.setItem("dc_audit_progress", "INVALID JSON");
      const retrieved = MemoryService.getAuditProgress();
      expect(retrieved).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Corrupted audit progress.");
    });

    it("handles save errors for audit progress", () => {
      jest.spyOn(global.localStorage, "setItem").mockImplementation(() => {
        throw new Error("Quota");
      });
      expect(() => {
        MemoryService.saveAuditProgress(baseProgress);
      }).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it("returns safely if window is undefined (SSR) for audit functions", () => {
      const origWindow = global.window;
      // @ts-expect-error - testing SSR window behavior
      delete global.window;
      expect(MemoryService.getAuditProgress()).toBeNull();
      expect(() => MemoryService.saveAuditProgress(baseProgress)).not.toThrow();
      expect(() => MemoryService.clearAuditProgress()).not.toThrow();
      global.window = origWindow;
    });
  });
});
