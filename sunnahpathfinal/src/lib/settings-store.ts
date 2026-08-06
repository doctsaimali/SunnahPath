/**
 * Settings Store — Detailed Habit Configuration
 * 
 * Allows users to customize:
 * - Pace of habit building (how fast to add new habits)
 * - Difficulty preference
 * - Reminder/notification preferences
 * - Review schedule
 * - Accountability preferences
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HabitPace = "gentle" | "moderate" | "ambitious";
// gentle: 1 habit per 2 weeks, moderate: 1 per week, ambitious: 1 per 3 days

export type DifficultyPreference = "easiest_first" | "most_impactful" | "chronological" | "custom";

export type ReviewDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type AccountabilityMode = "self" | "partner" | "community";

export type ReminderTime = {
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  label: string;
};

export type SettingsState = {
  // ─── Pace & Difficulty ──────────────────────────────
  /** How fast to introduce new habits */
  pace: HabitPace;
  /** Strategy for choosing which habit next */
  difficultyPreference: DifficultyPreference;
  /** Custom ordering of sunnah IDs (for custom difficulty preference) */
  customOrder: string[];
  /** Minimum streak (days) before allowing next habit */
  minStreakForNext: number;
  
  // ─── Time & Schedule ────────────────────────────────
  /** When the user's "day" starts (for overnight tracking) */
  dayStartTime: number; // hour 0-23
  /** Weekly review day */
  reviewDay: ReviewDay;
  /** Reminder times */
  reminders: ReminderTime[];
  
  // ─── Accountability ─────────────────────────────────
  /** Accountability mode */
  accountabilityMode: AccountabilityMode;
  /** Accountability partner name */
  partnerName: string;
  /** Whether to show commitment contract */
  showCommitmentContract: boolean;
  /** Whether daily reflections are required */
  requireDailyReflection: boolean;
  /** Whether weekly reviews are enabled */
  weeklyReviewEnabled: boolean;
  
  // ─── Display & UX ───────────────────────────────────
  /** Show Arabic text */
  showArabic: boolean;
  /** Show hadith grading badges */
  showGradingBadges: boolean;
  /** Compact card mode */
  compactMode: boolean;
  /** Animate celebrations */
  celebrateAnimations: boolean;
  /** Show implementation intention prompts */
  showIntentionPrompts: boolean;
  /** Dark mode (always dark for now, but future-proof) */
  theme: "dark" | "light" | "system";
  
  // ─── Streak Rules ───────────────────────────────────
  /** Enforce "never miss twice" rule */
  neverMissTwiceRule: boolean;
  /** Days to consider a habit "mastered" */
  masteryThreshold: number;
  /** Allow pausing habits */
  allowPausing: boolean;
  /** Maximum pauses before warning */
  maxPausesBeforeWarning: number;
  
  // ─── Focus Areas ────────────────────────────────────
  /** Preferred categories (shown first, prioritized) */
  focusCategories: string[];
  /** Categories to hide */
  hiddenCategories: string[];
  
  // ─── Actions ────────────────────────────────────────
  setPace: (pace: HabitPace) => void;
  setDifficultyPreference: (pref: DifficultyPreference) => void;
  setCustomOrder: (order: string[]) => void;
  setMinStreakForNext: (days: number) => void;
  setDayStartTime: (hour: number) => void;
  setReviewDay: (day: ReviewDay) => void;
  addReminder: (reminder: ReminderTime) => void;
  removeReminder: (index: number) => void;
  updateReminder: (index: number, reminder: ReminderTime) => void;
  setAccountabilityMode: (mode: AccountabilityMode) => void;
  setPartnerName: (name: string) => void;
  setShowCommitmentContract: (show: boolean) => void;
  setRequireDailyReflection: (require: boolean) => void;
  setWeeklyReviewEnabled: (enabled: boolean) => void;
  setShowArabic: (show: boolean) => void;
  setShowGradingBadges: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setCelebrateAnimations: (celebrate: boolean) => void;
  setShowIntentionPrompts: (show: boolean) => void;
  setNeverMissTwiceRule: (enforce: boolean) => void;
  setMasteryThreshold: (days: number) => void;
  setAllowPausing: (allow: boolean) => void;
  setMaxPausesBeforeWarning: (max: number) => void;
  setFocusCategories: (categories: string[]) => void;
  setHiddenCategories: (categories: string[]) => void;
  resetToDefaults: () => void;
};

const defaultReminders: ReminderTime[] = [
  { hour: 7, minute: 0, enabled: true, label: "Morning Adhkar" },
  { hour: 13, minute: 0, enabled: true, label: "Afternoon Check" },
  { hour: 21, minute: 0, enabled: true, label: "Evening Review" },
];

const defaultState = {
  pace: "moderate" as HabitPace,
  difficultyPreference: "easiest_first" as DifficultyPreference,
  customOrder: [] as string[],
  minStreakForNext: 3,
  dayStartTime: 5,
  reviewDay: "friday" as ReviewDay,
  reminders: defaultReminders,
  accountabilityMode: "self" as AccountabilityMode,
  partnerName: "",
  showCommitmentContract: true,
  requireDailyReflection: false,
  weeklyReviewEnabled: true,
  showArabic: true,
  showGradingBadges: true,
  compactMode: false,
  celebrateAnimations: true,
  showIntentionPrompts: true,
  theme: "dark" as const,
  neverMissTwiceRule: true,
  masteryThreshold: 7,
  allowPausing: true,
  maxPausesBeforeWarning: 3,
  focusCategories: [] as string[],
  hiddenCategories: [] as string[],
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      setPace: (pace) => set({ pace }),
      setDifficultyPreference: (difficultyPreference) => set({ difficultyPreference }),
      setCustomOrder: (customOrder) => set({ customOrder }),
      setMinStreakForNext: (minStreakForNext) => set({ minStreakForNext }),
      setDayStartTime: (dayStartTime) => set({ dayStartTime }),
      setReviewDay: (reviewDay) => set({ reviewDay }),
      addReminder: (reminder) => set((s) => ({ reminders: [...s.reminders, reminder] })),
      removeReminder: (index) => set((s) => ({ reminders: s.reminders.filter((_, i) => i !== index) })),
      updateReminder: (index, reminder) => set((s) => ({
        reminders: s.reminders.map((r, i) => i === index ? reminder : r),
      })),
      setAccountabilityMode: (accountabilityMode) => set({ accountabilityMode }),
      setPartnerName: (partnerName) => set({ partnerName }),
      setShowCommitmentContract: (showCommitmentContract) => set({ showCommitmentContract }),
      setRequireDailyReflection: (requireDailyReflection) => set({ requireDailyReflection }),
      setWeeklyReviewEnabled: (weeklyReviewEnabled) => set({ weeklyReviewEnabled }),
      setShowArabic: (showArabic) => set({ showArabic }),
      setShowGradingBadges: (showGradingBadges) => set({ showGradingBadges }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setCelebrateAnimations: (celebrateAnimations) => set({ celebrateAnimations }),
      setShowIntentionPrompts: (showIntentionPrompts) => set({ showIntentionPrompts }),
      setNeverMissTwiceRule: (neverMissTwiceRule) => set({ neverMissTwiceRule }),
      setMasteryThreshold: (masteryThreshold) => set({ masteryThreshold }),
      setAllowPausing: (allowPausing) => set({ allowPausing }),
      setMaxPausesBeforeWarning: (maxPausesBeforeWarning) => set({ maxPausesBeforeWarning }),
      setFocusCategories: (focusCategories) => set({ focusCategories }),
      setHiddenCategories: (hiddenCategories) => set({ hiddenCategories }),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: "sunnah-settings",
    }
  )
);
