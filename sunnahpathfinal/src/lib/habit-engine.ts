/**
 * Habit Engine — Psychology-Backed Habit Building System
 * 
 * Based on:
 * - BJ Fogg's Tiny Habits (anchor + tiny behavior + shine)
 * - James Clear's Atomic Habits (4 laws: make it obvious, attractive, easy, satisfying)
 * - Peter Gollwitzer's Implementation Intentions (If-Then planning)
 * - Seinfeld's "Don't Break the Chain" method
 * - "Never Miss Twice" rule (consistency > perfection)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────────

export type HabitPhase = "foundation" | "stacking" | "expansion" | "mastery";

export type HabitDifficulty = "tiny" | "small" | "moderate";

export type HabitStatus = "locked" | "available" | "active" | "mastered" | "paused";

export type ImplementationIntention = {
  id: string;
  sunnahId: string;
  /** The existing anchor/routine: "After I [anchor], I will [sunnah]" */
  anchor: string;
  /** Custom if-then plan */
  ifThenPlan: string;
  /** Time of day for the anchor */
  anchorTime: string;
  /** Whether this intention is active */
  active: boolean;
};

export type DailyCheckIn = {
  date: string; // YYYY-MM-DD
  completedSunnahIds: string[];
  missedSunnahIds: string[];
  /** 1-5 self-rating for the day */
  selfRating?: number;
  /** Brief reflection note */
  reflection?: string;
  /** What made it easy/hard today */
  obstacleNote?: string;
  /** How you overcame or plan to overcome */
  overcomeNote?: string;
};

export type HabitProgress = {
  sunnahId: string;
  status: HabitStatus;
  /** Day it was activated */
  activatedDate?: string;
  /** Day it was mastered (7-day streak achieved) */
  masteredDate?: string;
  /** Current consecutive streak */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
  /** Total days completed */
  totalDays: number;
  /** Dates completed (YYYY-MM-DD) */
  completedDates: string[];
  /** Whether yesterday was missed (for "never miss twice" rule) */
  missedYesterday: boolean;
  /** Number of times this habit was "paused" (relapse tracking) */
  pauseCount: number;
  /** Implementation intention attached */
  intentionId?: string;
  /** Order in the habit stack (1 = first/keystone) */
  stackOrder: number;
  /** Difficulty rating for this habit */
  difficulty: HabitDifficulty;
};

export type Milestone = {
  id: string;
  type: "first_complete" | "streak_3" | "streak_7" | "streak_14" | "streak_21" | "streak_30" | "streak_66" | "all_mastered" | "phase_advance" | "never_miss_twice_7" | "never_miss_twice_30";
  sunnahId?: string;
  date: string;
  title: string;
  description: string;
  celebrated: boolean;
};

export type HabitEngineState = {
  // ─── Core State ─────────────────────────────────────
  /** All habit progress records */
  habits: Record<string, HabitProgress>;
  /** Implementation intentions */
  intentions: ImplementationIntention[];
  /** Daily check-ins */
  checkIns: DailyCheckIn[];
  /** Milestones achieved */
  milestones: Milestone[];
  
  // ─── Phase Management ───────────────────────────────
  /** Current phase in the habit building journey */
  currentPhase: HabitPhase;
  /** The keystone (first) habit ID */
  keystoneHabitId: string | null;
  /** How many habits can be active at once (starts at 1) */
  maxActiveHabits: number;
  /** Whether onboarding is complete */
  onboardingComplete: boolean;
  /** Current step in onboarding flow */
  onboardingStep: number;
  
  // ─── Streak Metrics ────────────────────────────────
  /** Global current streak (days in a row with at least 1 habit done) */
  globalStreak: number;
  /** Global longest streak */
  globalLongestStreak: number;
  /** Consecutive days following "never miss twice" rule */
  neverMissTwiceStreak: number;
  
  // ─── Actions ────────────────────────────────────────
  /** Start onboarding: select keystone habit */
  selectKeystoneHabit: (sunnahId: string, difficulty: HabitDifficulty) => void;
  /** Add implementation intention for a habit */
  addIntention: (intention: ImplementationIntention) => void;
  /** Mark a habit as done today */
  markHabitDone: (sunnahId: string) => void;
  /** Mark a habit as missed today */
  markHabitMissed: (sunnahId: string) => void;
  /** Activate next available habit (one-by-one) */
  activateNextHabit: (sunnahId: string, difficulty: HabitDifficulty) => void;
  /** Pause a habit (relapse handling) */
  pauseHabit: (sunnahId: string) => void;
  /** Resume a paused habit */
  resumeHabit: (sunnahId: string) => void;
  /** Complete daily check-in */
  submitDailyCheckIn: (checkIn: DailyCheckIn) => void;
  /** Get habit progress for a sunnah */
  getHabitProgress: (sunnahId: string) => HabitProgress | undefined;
  /** Check if a habit can be activated (one-by-one rule) */
  canActivateHabit: () => boolean;
  /** Get the recommended next habit based on difficulty & category */
  getRecommendedNext: (availableSunnahIds: string[]) => string | null;
  /** Advance phase if conditions met */
  checkPhaseAdvancement: () => void;
  /** Complete onboarding step */
  completeOnboardingStep: () => void;
  /** Reset all data */
  resetEngine: () => void;
};

// ─── Helper Functions ───────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = getToday();
  const yesterday = getYesterday();
  
  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(sorted[i], sorted[i - 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function generateMilestone(
  type: Milestone["type"],
  sunnahId: string | undefined,
  title: string,
  description: string
): Milestone {
  return {
    id: `milestone-${type}-${sunnahId || "global"}-${Date.now()}`,
    type,
    sunnahId,
    date: getToday(),
    title,
    description,
    celebrated: false,
  };
}

// ─── Phase Advancement Rules ────────────────────────────────────────────

function determinePhase(habits: Record<string, HabitProgress>): HabitPhase {
  const activeHabits = Object.values(habits).filter(h => h.status === "active" || h.status === "mastered");
  const masteredHabits = activeHabits.filter(h => h.status === "mastered");
  
  if (masteredHabits.length === 0) return "foundation";
  if (masteredHabits.length <= 2) return "stacking";
  if (masteredHabits.length <= 5) return "expansion";
  return "mastery";
}

function getMaxActiveForPhase(phase: HabitPhase): number {
  switch (phase) {
    case "foundation": return 1;
    case "stacking": return 2;
    case "expansion": return 3;
    case "mastery": return 5;
  }
}

// ─── Store ──────────────────────────────────────────────────────────────

export const useHabitEngine = create<HabitEngineState>()(
  persist(
    (set, get) => ({
      // ─── Initial State ──────────────────────────────────
      habits: {},
      intentions: [],
      checkIns: [],
      milestones: [],
      currentPhase: "foundation",
      keystoneHabitId: null,
      maxActiveHabits: 1,
      onboardingComplete: false,
      onboardingStep: 0,
      globalStreak: 0,
      globalLongestStreak: 0,
      neverMissTwiceStreak: 0,

      // ─── Select Keystone Habit ───────────────────────────
      selectKeystoneHabit: (sunnahId, difficulty) => {
        const today = getToday();
        const habit: HabitProgress = {
          sunnahId,
          status: "active",
          activatedDate: today,
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
          completedDates: [],
          missedYesterday: false,
          pauseCount: 0,
          stackOrder: 1,
          difficulty,
        };

        set((state) => ({
          habits: { ...state.habits, [sunnahId]: habit },
          keystoneHabitId: sunnahId,
          currentPhase: "foundation",
          maxActiveHabits: 1,
          onboardingStep: 1,
        }));
      },

      // ─── Add Implementation Intention ───────────────────
      addIntention: (intention) => {
        set((state) => {
          const habits = { ...state.habits };
          if (habits[intention.sunnahId]) {
            habits[intention.sunnahId] = {
              ...habits[intention.sunnahId],
              intentionId: intention.id,
            };
          }
          return {
            intentions: [...state.intentions, intention],
            habits,
          };
        });
      },

      // ─── Mark Habit Done ────────────────────────────────
      markHabitDone: (sunnahId) => {
        const today = getToday();
        set((state) => {
          const habits = { ...state.habits };
          const habit = habits[sunnahId];
          if (!habit) return state;

          // Don't double-count
          if (habit.completedDates.includes(today)) return state;

          const newCompletedDates = [...habit.completedDates, today];
          const newStreak = calculateStreak(newCompletedDates);
          const newLongest = Math.max(habit.longestStreak, newStreak);

          const updatedHabit: HabitProgress = {
            ...habit,
            currentStreak: newStreak,
            longestStreak: newLongest,
            totalDays: habit.totalDays + 1,
            completedDates: newCompletedDates,
            missedYesterday: false,
            // Check mastery: 7-day streak = mastered
            status: newStreak >= 7 ? "mastered" : habit.status,
            masteredDate: newStreak >= 7 && !habit.masteredDate ? today : habit.masteredDate,
          };

          habits[sunnahId] = updatedHabit;

          // Check for milestones
          const newMilestones: Milestone[] = [];

          // First completion
          if (habit.totalDays === 0) {
            newMilestones.push(generateMilestone("first_complete", sunnahId, "First Step Taken!", "You completed your first day of this Sunnah. Every journey begins with a single step."));
          }

          // Streak milestones
          if (newStreak >= 3 && habit.currentStreak < 3) {
            newMilestones.push(generateMilestone("streak_3", sunnahId, "3-Day Streak! 🔥", "Three days in a row! You're building momentum. Research shows habits start feeling natural around day 3."));
          }
          if (newStreak >= 7 && habit.currentStreak < 7) {
            newMilestones.push(generateMilestone("streak_7", sunnahId, "One Week Strong! ⭐", "7 days! This is the threshold where behaviors become semi-automatic. You've formed a mini-habit!"));
          }
          if (newStreak >= 14 && habit.currentStreak < 14) {
            newMilestones.push(generateMilestone("streak_14", sunnahId, "Two Weeks! 💪", "14 days of consistency. Your brain is rewiring — this habit is becoming part of your identity."));
          }
          if (newStreak >= 21 && habit.currentStreak < 21) {
            newMilestones.push(generateMilestone("streak_21", sunnahId, "21-Day Habit! 🌟", "21 days — the classic habit formation period. This Sunnah is now a natural part of your routine."));
          }
          if (newStreak >= 30 && habit.currentStreak < 30) {
            newMilestones.push(generateMilestone("streak_30", sunnahId, "Monthly Mastery! 🏆", "30 days! You've maintained this Sunnah for a full month. It's now deeply embedded in your daily life."));
          }
          if (newStreak >= 66 && habit.currentStreak < 66) {
            newMilestones.push(generateMilestone("streak_66", sunnahId, "66 Days: Automatic! 🎯", "66 days — research shows this is the average time for a habit to become fully automatic. You've made it!"));
          }

          // Recalculate global streak
          const allDates = Object.values(habits)
            .filter(h => h.status === "active" || h.status === "mastered")
            .flatMap(h => h.completedDates);
          const uniqueDates = [...new Set(allDates)].sort();
          const globalStreak = calculateStreak(uniqueDates);
          const globalLongestStreak = Math.max(state.globalLongestStreak, globalStreak);

          // Determine new phase
          const newPhase = determinePhase(habits);
          const newMaxActive = getMaxActiveForPhase(newPhase);

          return {
            habits,
            milestones: [...state.milestones, ...newMilestones],
            globalStreak,
            globalLongestStreak,
            currentPhase: newPhase,
            maxActiveHabits: newMaxActive,
          };
        });
      },

      // ─── Mark Habit Missed ──────────────────────────────
      markHabitMissed: (sunnahId) => {
        set((state) => {
          const habits = { ...state.habits };
          const habit = habits[sunnahId];
          if (!habit) return state;

          habits[sunnahId] = {
            ...habit,
            missedYesterday: true,
            // "Never Miss Twice" — reset streak if this is 2nd miss in a row
            currentStreak: habit.missedYesterday ? 0 : habit.currentStreak,
          };

          return { habits };
        });
      },

      // ─── Activate Next Habit (one-by-one) ───────────────
      activateNextHabit: (sunnahId, difficulty) => {
        const state = get();
        if (!state.canActivateHabit()) return;

        const today = getToday();
        const activeCount = Object.values(state.habits).filter(h => h.status === "active").length;
        const masteredCount = Object.values(state.habits).filter(h => h.status === "mastered").length;

        const habit: HabitProgress = {
          sunnahId,
          status: "active",
          activatedDate: today,
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
          completedDates: [],
          missedYesterday: false,
          pauseCount: 0,
          stackOrder: masteredCount + activeCount + 1,
          difficulty,
        };

        set((s) => ({
          habits: { ...s.habits, [sunnahId]: habit },
        }));
      },

      // ─── Pause Habit ────────────────────────────────────
      pauseHabit: (sunnahId) => {
        set((state) => {
          const habits = { ...state.habits };
          if (habits[sunnahId]) {
            habits[sunnahId] = {
              ...habits[sunnahId],
              status: "paused",
              pauseCount: habits[sunnahId].pauseCount + 1,
            };
          }
          return { habits };
        });
      },

      // ─── Resume Habit ───────────────────────────────────
      resumeHabit: (sunnahId) => {
        set((state) => {
          const habits = { ...state.habits };
          if (habits[sunnahId]) {
            habits[sunnahId] = {
              ...habits[sunnahId],
              status: "active",
            };
          }
          return { habits };
        });
      },

      // ─── Daily Check-In ─────────────────────────────────
      submitDailyCheckIn: (checkIn) => {
        set((state) => {
          const existing = state.checkIns.filter(c => c.date !== checkIn.date);
          return { checkIns: [...existing, checkIn] };
        });
      },

      // ─── Get Habit Progress ─────────────────────────────
      getHabitProgress: (sunnahId) => {
        return get().habits[sunnahId];
      },

      // ─── Can Activate Habit? ────────────────────────────
      canActivateHabit: () => {
        const state = get();
        const activeCount = Object.values(state.habits).filter(h => h.status === "active").length;
        
        // One-by-one rule: can only add next if:
        // 1. Active count is below max for current phase
        // 2. At least one active habit has a 3+ day streak (or no active habits yet)
        const hasSufficientStreak = Object.values(state.habits)
          .filter(h => h.status === "active")
          .some(h => h.currentStreak >= 3);
        
        return activeCount < state.maxActiveHabits && (activeCount === 0 || hasSufficientStreak);
      },

      // ─── Get Recommended Next Habit ─────────────────────
      getRecommendedNext: (availableSunnahIds) => {
        const state = get();
        const activeIds = new Set(
          Object.values(state.habits)
            .filter(h => h.status === "active" || h.status === "mastered")
            .map(h => h.sunnahId)
        );
        
        // Filter to only available (not already active/mastered)
        const candidates = availableSunnahIds.filter(id => !activeIds.has(id));
        if (candidates.length === 0) return null;

        // In foundation phase, prefer "tiny" difficulty
        if (state.currentPhase === "foundation") {
          // Return first candidate — the UI should sort by difficulty
          return candidates[0];
        }

        // In stacking phase, prefer habits in same category as existing active
        const activeCategories = Object.values(state.habits)
          .filter(h => h.status === "active" || h.status === "mastered")
          .map(h => h.sunnahId.split("-")[0]);

        // Prefer same-category habits (habit stacking is easier)
        const sameCategory = candidates.filter(id => 
          activeCategories.some(cat => id.startsWith(cat))
        );
        
        return sameCategory.length > 0 ? sameCategory[0] : candidates[0];
      },

      // ─── Check Phase Advancement ────────────────────────
      checkPhaseAdvancement: () => {
        const state = get();
        const newPhase = determinePhase(state.habits);
        
        if (newPhase !== state.currentPhase) {
          const newMaxActive = getMaxActiveForPhase(newPhase);
          const newMilestones: Milestone[] = [
            generateMilestone(
              "phase_advance",
              undefined,
              `Advanced to ${newPhase.charAt(0).toUpperCase() + newPhase.slice(1)} Phase!`,
              `You've progressed to the ${newPhase} phase. You can now have up to ${newMaxActive} active habits at once.`
            ),
          ];
          set({
            currentPhase: newPhase,
            maxActiveHabits: newMaxActive,
            milestones: [...state.milestones, ...newMilestones],
          });
        }
      },

      // ─── Complete Onboarding Step ───────────────────────
      completeOnboardingStep: () => {
        set((state) => ({
          onboardingStep: state.onboardingStep + 1,
          onboardingComplete: state.onboardingStep >= 3,
        }));
      },

      // ─── Reset Engine ───────────────────────────────────
      resetEngine: () => {
        set({
          habits: {},
          intentions: [],
          checkIns: [],
          milestones: [],
          currentPhase: "foundation",
          keystoneHabitId: null,
          maxActiveHabits: 1,
          onboardingComplete: false,
          onboardingStep: 0,
          globalStreak: 0,
          globalLongestStreak: 0,
          neverMissTwiceStreak: 0,
        });
      },
    }),
    {
      name: "sunnah-habit-engine",
    }
  )
);
