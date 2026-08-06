/**
 * Accountability Store — Weekly Reviews, Check-ins, Commitment Contracts
 * 
 * Features:
 * - Daily evening reflections (what worked, what was hard)
 * - Weekly review with structured questions
 * - Commitment contract (self-binding)
 * - Accountability partner tracking
 * - "Never Miss Twice" violation log
 * - Progress snapshots for trend analysis
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────────

export type EveningReflection = {
  date: string; // YYYY-MM-DD
  /** Overall day rating 1-5 */
  dayRating: number;
  /** What went well */
  wins: string[];
  /** What was challenging */
  challenges: string[];
  /** How challenges were/will be overcome */
  overcomePlan: string;
  /** Gratitude note */
  gratitude?: string;
  /** Intention for tomorrow */
  tomorrowIntention?: string;
  /** Which sunnahs were completed */
  completedSunnahIds: string[];
  /** Which sunnahs were missed */
  missedSunnahIds: string[];
};

export type WeeklyReview = {
  id: string;
  /** Week start date (Monday) */
  weekStart: string;
  /** Week end date (Sunday/Friday) */
  weekEnd: string;
  /** Overall week rating 1-5 */
  weekRating: number;
  /** Biggest win of the week */
  biggestWin: string;
  /** Biggest challenge of the week */
  biggestChallenge: string;
  /** Adjustments for next week */
  nextWeekPlan: string;
  /** Habits to continue */
  continueHabits: string[];
  /** Habits to adjust */
  adjustHabits: string[];
  /** New habits to add */
  newHabitCandidates: string[];
  /** Reflection notes */
  notes: string;
  /** Completion rate for the week (%) */
  completionRate: number;
  /** Streak at end of week */
  streakAtEnd: number;
  /** Whether review was submitted */
  submitted: boolean;
};

export type CommitmentContract = {
  /** Date the contract was signed */
  signDate: string;
  /** The commitment text */
  commitmentText: string;
  /** Personal motivation */
  motivation: string;
  /** Consequence for not following through (self-imposed) */
  consequence: string;
  /** Reward for consistency */
  reward: string;
  /** Whether contract is active */
  active: boolean;
  /** Days since signing */
  daysSinceSigned: number;
};

export type ViolationLog = {
  date: string;
  sunnahId: string;
  reason: string;
  /** Was this a "miss twice" violation? */
  isDoubleMiss: boolean;
  /** Recovery plan */
  recoveryPlan: string;
  /** Whether recovered */
  recovered: boolean;
  /** Date of recovery */
  recoveryDate?: string;
};

export type AccountabilityState = {
  // ─── Core Data ──────────────────────────────────────
  eveningReflections: EveningReflection[];
  weeklyReviews: WeeklyReview[];
  commitmentContract: CommitmentContract | null;
  violationLogs: ViolationLog[];
  
  // ─── Computed Metrics ───────────────────────────────
  /** Average day rating over last 7 days */
  avgWeekRating: number;
  /** Average completion rate over last 4 weeks */
  avgMonthCompletion: number;
  /** Total violations this month */
  violationsThisMonth: number;
  /** Violations that were recovered */
  recoveriesThisMonth: number;
  
  // ─── Actions ────────────────────────────────────────
  submitEveningReflection: (reflection: EveningReflection) => void;
  submitWeeklyReview: (review: WeeklyReview) => void;
  signCommitmentContract: (contract: CommitmentContract) => void;
  revokeCommitmentContract: () => void;
  logViolation: (violation: ViolationLog) => void;
  recoverViolation: (date: string, sunnahId: string, recoveryDate: string) => void;
  getReflectionForDate: (date: string) => EveningReflection | undefined;
  getLatestWeeklyReview: () => WeeklyReview | undefined;
  getViolationRate: () => number; // violations / total active days
  resetAccountability: () => void;
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(d1: string, d2: string): number {
  return Math.floor(Math.abs(new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}

export const useAccountability = create<AccountabilityState>()(
  persist(
    (set, get) => ({
      eveningReflections: [],
      weeklyReviews: [],
      commitmentContract: null,
      violationLogs: [],
      avgWeekRating: 0,
      avgMonthCompletion: 0,
      violationsThisMonth: 0,
      recoveriesThisMonth: 0,

      submitEveningReflection: (reflection) => {
        set((state) => {
          const existing = state.eveningReflections.filter(r => r.date !== reflection.date);
          const reflections = [...existing, reflection];
          
          // Recalculate avg week rating
          const last7 = reflections
            .filter(r => daysBetween(r.date, getToday()) <= 7)
            .map(r => r.dayRating);
          const avgWeekRating = last7.length > 0 ? last7.reduce((a, b) => a + b, 0) / last7.length : 0;
          
          return { eveningReflections: reflections, avgWeekRating };
        });
      },

      submitWeeklyReview: (review) => {
        set((state) => {
          const existing = state.weeklyReviews.filter(r => r.weekStart !== review.weekStart);
          const reviews = [...existing, review];
          
          // Recalculate avg month completion
          const last4 = reviews.slice(-4).map(r => r.completionRate);
          const avgMonthCompletion = last4.length > 0 ? last4.reduce((a, b) => a + b, 0) / last4.length : 0;
          
          return { weeklyReviews: reviews, avgMonthCompletion };
        });
      },

      signCommitmentContract: (contract) => {
        set({ commitmentContract: { ...contract, daysSinceSigned: 0 } });
      },

      revokeCommitmentContract: () => {
        set({ commitmentContract: null });
      },

      logViolation: (violation) => {
        set((state) => {
          const logs = [...state.violationLogs, violation];
          const thisMonth = getToday().substring(0, 7);
          const violationsThisMonth = logs.filter(l => l.date.startsWith(thisMonth)).length;
          return { violationLogs: logs, violationsThisMonth };
        });
      },

      recoverViolation: (date, sunnahId, recoveryDate) => {
        set((state) => {
          const logs = state.violationLogs.map(l =>
            l.date === date && l.sunnahId === sunnahId
              ? { ...l, recovered: true, recoveryDate }
              : l
          );
          const thisMonth = getToday().substring(0, 7);
          const recoveriesThisMonth = logs.filter(
            l => l.date.startsWith(thisMonth) && l.recovered
          ).length;
          return { violationLogs: logs, recoveriesThisMonth };
        });
      },

      getReflectionForDate: (date) => {
        return get().eveningReflections.find(r => r.date === date);
      },

      getLatestWeeklyReview: () => {
        const reviews = get().weeklyReviews;
        return reviews.length > 0 ? reviews[reviews.length - 1] : undefined;
      },

      getViolationRate: () => {
        const state = get();
        const totalActiveDays = state.violationLogs.length +
          state.violationLogs.filter(l => l.recovered).length;
        if (totalActiveDays === 0) return 0;
        return state.violationLogs.length / totalActiveDays;
      },

      resetAccountability: () => {
        set({
          eveningReflections: [],
          weeklyReviews: [],
          commitmentContract: null,
          violationLogs: [],
          avgWeekRating: 0,
          avgMonthCompletion: 0,
          violationsThisMonth: 0,
          recoveriesThisMonth: 0,
        });
      },
    }),
    {
      name: "sunnah-accountability",
    }
  )
);
