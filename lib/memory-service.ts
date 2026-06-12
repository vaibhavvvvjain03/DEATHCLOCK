export interface MissionRecord {
  id: string; // usually swap index or a generated ID
  action: string;
  difficulty: "easy" | "medium" | "hard";
  secondsBack: number;
  localContext: string;
  status: "pending" | "in_progress" | "completed";
  acceptedDate?: string;
  completedDate?: string;
}

export interface InvestigationRecord {
  id: string;
  city: string;
  burnRate: number;
  categoryScores: Record<string, number>;
  completionDate: string;
  answers?: Record<string, string>;
}

export interface ClimateProfile {
  version: number;
  city: string;
  answers: Record<string, string>;
  personalBurnRate: number;
  categoryScores: Record<string, number>;
  missions: MissionRecord[];
  verdict: string;
  auditCompletionDate?: string;
  lastVisitDate: string;
  totalInvestigations: number;
  pastInvestigations: InvestigationRecord[];
}

export interface AuditProgress {
  version: number;
  city: string;
  qIdx: number;
  catIdx: number;
  answers: Record<string, string>;
  totalBurnRate: number;
  lastActivity: string;
}

const PROFILE_KEY = "dc_climate_profile";
const PROGRESS_KEY = "dc_audit_progress";
const SCHEMA_VERSION = 1;

export const MemoryService = {
  getProfile: (): ClimateProfile | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== SCHEMA_VERSION) {
        // Handle migration if needed in the future
      }
      // Migrate previousInvestigation to pastInvestigations
      if (parsed.previousInvestigation && !parsed.pastInvestigations) {
        parsed.pastInvestigations = [
          {
            id: "INV-001",
            city: parsed.previousInvestigation.city,
            burnRate: parsed.previousInvestigation.burnRate,
            categoryScores: {}, // We don't have historical category scores for legacy data
            completionDate: parsed.previousInvestigation.completionDate
          }
        ];
        delete parsed.previousInvestigation;
      } else if (!parsed.pastInvestigations) {
        parsed.pastInvestigations = [];
      }
      return parsed as ClimateProfile;
    } catch {
      console.error("Corrupted climate profile in storage.");
      return null;
    }
  },

  saveProfile: (profile: Omit<ClimateProfile, "version" | "lastVisitDate">) => {
    if (typeof window === "undefined") return;
    try {
      const fullProfile: ClimateProfile = {
        ...profile,
        version: SCHEMA_VERSION,
        lastVisitDate: new Date().toISOString(),
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(fullProfile));
    } catch (e) {
      console.error("Failed to save climate profile.", e);
    }
  },

  updateLastVisit: () => {
    const profile = MemoryService.getProfile();
    if (profile) {
      profile.lastVisitDate = new Date().toISOString();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  },

  getAuditProgress: (): AuditProgress | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed as AuditProgress;
    } catch {
      console.error("Corrupted audit progress.");
      return null;
    }
  },

  saveAuditProgress: (progress: Omit<AuditProgress, "version" | "lastActivity">) => {
    if (typeof window === "undefined") return;
    try {
      const fullProgress: AuditProgress = {
        ...progress,
        version: SCHEMA_VERSION,
        lastActivity: new Date().toISOString(),
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(fullProgress));
    } catch (e) {
      console.error("Failed to save audit progress.", e);
    }
  },

  clearAuditProgress: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PROGRESS_KEY);
  },
};
