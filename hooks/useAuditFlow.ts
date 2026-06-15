import { useState, useMemo, useCallback } from "react";
import { QUESTION_BANK, CATEGORY_KEYS, CATEGORY_NAMES } from "@/lib/questions";
import { MemoryService, ClimateProfile, MissionRecord } from "@/lib/memory-service";
import { calculateBurnRate } from "@/lib/utils";

export type QuestionBank = typeof QUESTION_BANK;

/**
 * TRACK: Calculates the user's personal daily carbon burn rate in real-time
 * based on 18 lifestyle questions across 6 categories (Movement, Food, Home,
 * Consumption, Water & Waste, Work), using emission-factor-based scoring
 * from lib/questions.ts. Orchestrates the full multi-step audit state machine
 * and triggers Gemini API (/api/swaps) on completion to generate missions.
 *
 * Manages the 18-question personal carbon audit
 * flow: current category, current question index,
 * accumulated answers per category, running total
 * burn rate, and category transition state.
 */
export function useAuditFlow(city: string, onAuditComplete?: () => void) {
  const [catIdx, setCatIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const totalBurnRate = useMemo(() => calculateBurnRate(answers), [answers]);
  const [auditDone, setAuditDone] = useState(false);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [floatingRestore, setFloatingRestore] = useState<{ id: string; seconds: number; key: number } | null>(null);
  const [showBurnoutPopup, setShowBurnoutPopup] = useState(false);
  const [profile, setProfile] = useState<ClimateProfile | null>(null);

  // Audit transition
  const [transitioning, setTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [showBriefing, setShowBriefing] = useState(true);

  // Processing state
  const [processingQ, setProcessingQ] = useState(false);
  const [processingLines, setProcessingLines] = useState<string[]>([]);

  const catKeys = CATEGORY_KEYS;
  const currentCatKey = catKeys[catIdx];
  const currentQuestions = useMemo(
    () => (currentCatKey ? QUESTION_BANK[currentCatKey] : []),
    [currentCatKey]
  );
  const currentQ = currentQuestions[qIdx];
  const totalQs = catKeys.reduce((sum, k) => sum + QUESTION_BANK[k].length, 0);
  const answeredQs = Object.keys(answers).length;

  const finishAudit = useCallback(async (allAnswers: Record<string, string>, burnRate: number) => {
    setLoadingSwaps(true);
    if (onAuditComplete) onAuditComplete();
    const categoryScores: Record<string, number> = {};
    CATEGORY_KEYS.forEach(key => {
      let score = 0;
      QUESTION_BANK[key].forEach(q => {
        const selectedVal = allAnswers[q.id];
        const option = q.options.find(o => o.value === selectedVal);
        if (option) score += option.burnRate;
      });
      categoryScores[key] = Math.max(0, score);
    });

    const createProfileObject = (newMissions: MissionRecord[]) => {
      const existingProfile = MemoryService.getProfile();
      const pastInvestigations = existingProfile?.pastInvestigations || [];

      if (existingProfile) {
        pastInvestigations.push({
          id: `INV-${String(existingProfile.totalInvestigations).padStart(3, '0')}`,
          city: existingProfile.city,
          burnRate: existingProfile.personalBurnRate,
          categoryScores: existingProfile.categoryScores || {},
          completionDate: existingProfile.auditCompletionDate || existingProfile.lastVisitDate,
          answers: existingProfile.answers
        });
      }

      return {
        city,
        answers: allAnswers,
        personalBurnRate: burnRate,
        categoryScores,
        missions: newMissions,
        verdict: "COMPLETED",
        auditCompletionDate: new Date().toISOString(),
        totalInvestigations: existingProfile ? existingProfile.totalInvestigations + 1 : 1,
        pastInvestigations
      };
    };

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: city,
          allAnswers,
          personalDailySeconds: burnRate,
        }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const swapList = data.swaps || [];
      if (swapList.length === 0) throw new Error("Empty swaps from API");

      const newMissions: MissionRecord[] = swapList.map((s: Partial<MissionRecord>, i: number) => ({
        id: `msn_${Date.now()}_${i}`,
        ...s,
        status: "pending"
      } as MissionRecord));
      setMissions(newMissions);

      MemoryService.saveProfile(createProfileObject(newMissions));
      setProfile(MemoryService.getProfile());
      MemoryService.clearAuditProgress();
    } catch {
      const fallbackMissions: MissionRecord[] = [
        { id: "msn_f1", action: "Switch to 100% renewable energy provider", difficulty: "medium", secondsBack: 21600, localContext: "Your regional grid has multiple green energy options available for immediate switch.", status: "pending" },
        { id: "msn_f2", action: "Replace all vehicle trips under 3km with walking/cycling", difficulty: "easy", secondsBack: 14400, localContext: "Short trips are the most emission-intensive per kilometer.", status: "pending" },
        { id: "msn_f3", action: "Eliminate beef and lamb from diet", difficulty: "hard", secondsBack: 28800, localContext: "Ruminant meat has the highest carbon footprint of all food sources.", status: "pending" }
      ];
      setMissions(fallbackMissions);
      MemoryService.saveProfile(createProfileObject(fallbackMissions));
      setProfile(MemoryService.getProfile());
      MemoryService.clearAuditProgress();
    } finally {
      setLoadingSwaps(false);
      setAuditDone(true);
      setShowBurnoutPopup(true);
    }
  }, [city, onAuditComplete]);

  const handleAnswer = useCallback((optionValue: string, burnRate: number) => {
    if (processingQ || transitioning) return;

    const newAnswers = { ...answers, [currentQ.id]: optionValue };
    const newBurn = calculateBurnRate(newAnswers);
    setAnswers(newAnswers);

    // Show processing lines
    setProcessingQ(true);
    setProcessingLines([]);
    const lines = ["> PROCESSING INPUT...", "> CALCULATING DELTA...", "> UPDATING TIMELINE..."];
    lines.forEach((l, i) => {
      setTimeout(() => {
        setProcessingLines((prev) => [...prev, l]);
      }, i * 50);
    });

    setTimeout(() => {
      setProcessingQ(false);
      setProcessingLines([]);

      const nextQIdx = qIdx + 1;
      if (nextQIdx < currentQuestions.length) {
        setQIdx(nextQIdx);
        MemoryService.saveAuditProgress({ city, catIdx, qIdx: nextQIdx, answers: newAnswers, totalBurnRate: newBurn });
      } else {
        const nextCatIdx = catIdx + 1;
        if (nextCatIdx < catKeys.length) {
          // Show transition screen
          const nextCatName = CATEGORY_NAMES[nextCatIdx];
          setTransitionText(`ADVANCING TO ${nextCatName} ›`);
          setTransitioning(true);
          setTimeout(() => {
            setTransitioning(false);
            setCatIdx(nextCatIdx);
            setQIdx(0);
            MemoryService.saveAuditProgress({ city, catIdx: nextCatIdx, qIdx: 0, answers: newAnswers, totalBurnRate: newBurn });
          }, 500);
        } else {
          // All done — call swaps API
          setCatIdx(nextCatIdx); // Set beyond array to trigger "AUDIT COMPLETE"
          finishAudit(newAnswers, newBurn);
        }
      }
    }, 200);
  }, [processingQ, transitioning, answers, currentQ, qIdx, currentQuestions, catIdx, catKeys, city, finishAudit]);

  const handleCommit = useCallback((mission: MissionRecord, idx: number) => {
    const isCompleted = mission.status === "completed";
    const nextStatus = isCompleted ? "pending" : "completed";

    const newMissions = [...missions];
    newMissions[idx] = {
      ...mission,
      status: nextStatus,
      completedDate: nextStatus === "completed" ? new Date().toISOString() : undefined
    };

    setMissions(newMissions);
    if (profile) {
      const newProfile = { ...profile, missions: newMissions };
      MemoryService.saveProfile(newProfile);
      setProfile(MemoryService.getProfile());
    }

    if (nextStatus === "completed") {
      setFloatingRestore({ id: mission.id, seconds: mission.secondsBack, key: Date.now() });
      setTimeout(() => setFloatingRestore(null), 1500);
    }
  }, [missions, profile]);

  const resetAudit = useCallback(() => {
    setCatIdx(0);
    setQIdx(0);
    setAnswers({});
    setAuditDone(false);
    setMissions([]);
    MemoryService.clearAuditProgress();
  }, []);

  const initFromStorage = useCallback((storedCity: string) => {
    const existingProfile = MemoryService.getProfile();
    if (existingProfile) {
      setProfile(existingProfile);
      setMissions(existingProfile.missions || []);
    }

    const progress = MemoryService.getAuditProgress();
    if (progress && progress.city === storedCity) {
      setCatIdx(progress.catIdx);
      setQIdx(progress.qIdx);
      setAnswers(progress.answers);
      if (progress.catIdx > 0 || progress.qIdx > 0) {
        setShowBriefing(false);
      }
    }
  }, []);

  return {
    // State
    catIdx,
    qIdx,
    answers,
    totalBurnRate,
    auditDone,
    loadingSwaps,
    missions,
    floatingRestore,
    showBurnoutPopup,
    setShowBurnoutPopup,
    profile,
    transitioning,
    transitionText,
    showBriefing,
    setShowBriefing,
    processingQ,
    processingLines,
    // Derived
    catKeys,
    currentCatKey,
    currentQuestions,
    currentQ,
    totalQs,
    answeredQs,
    // Handlers
    handleAnswer,
    handleCommit,
    resetAudit,
    initFromStorage,
  };
}
