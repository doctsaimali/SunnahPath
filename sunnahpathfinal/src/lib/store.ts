import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SunnahTrackerState {
  completedSunnahs: Record<string, boolean>;
  streaks: Record<string, number>;
  lastDoneDates: Record<string, string>;
  dailyLogs: Record<string, string[]>;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  
  toggleSunnah: (sunnahId: string) => void;
  isCompleted: (sunnahId: string) => boolean;
  getTodayCompleted: () => string[];
  getTodayDate: () => string;
  getCategoryProgress: (categoryId: string, totalInCategory: number) => number;
  resetAll: () => void;
}

export const useSunnahTracker = create<SunnahTrackerState>()(
  persist(
    (set, get) => ({
      completedSunnahs: {},
      streaks: {},
      lastDoneDates: {},
      dailyLogs: {},
      totalCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,

      getTodayDate: () => {
        return new Date().toISOString().split("T")[0];
      },

      toggleSunnah: (sunnahId: string) => {
        const state = get();
        const today = state.getTodayDate();
        const isCurrentlyCompleted = state.completedSunnahs[sunnahId];

        const newCompleted = { ...state.completedSunnahs };
        const newStreaks = { ...state.streaks };
        const newLastDone = { ...state.lastDoneDates };
        const newDailyLogs = { ...state.dailyLogs };
        let newTotalCompleted = state.totalCompleted;

        if (isCurrentlyCompleted) {
          delete newCompleted[sunnahId];
          newStreaks[sunnahId] = Math.max(0, (newStreaks[sunnahId] || 0) - 1);
          newTotalCompleted = Math.max(0, newTotalCompleted - 1);
          const todayLog = newDailyLogs[today] || [];
          newDailyLogs[today] = todayLog.filter(id => id !== sunnahId);
        } else {
          newCompleted[sunnahId] = true;
          newStreaks[sunnahId] = (newStreaks[sunnahId] || 0) + 1;
          newLastDone[sunnahId] = today;
          newTotalCompleted = newTotalCompleted + 1;
          const todayLog = newDailyLogs[today] || [];
          if (!todayLog.includes(sunnahId)) {
            newDailyLogs[today] = [...todayLog, sunnahId];
          }
        }

        // Calculate streaks
        const todayLog = newDailyLogs[today] || [];
        let currentStreak = 0;
        let longestStreak = state.longestStreak;
        const date = new Date();
        while (true) {
          const dateStr = date.toISOString().split("T")[0];
          const log = newDailyLogs[dateStr] || [];
          if (log.length > 0) {
            currentStreak++;
            date.setDate(date.getDate() - 1);
          } else {
            break;
          }
        }
        if (currentStreak > longestStreak) longestStreak = currentStreak;

        set({
          completedSunnahs: newCompleted,
          streaks: newStreaks,
          lastDoneDates: newLastDone,
          dailyLogs: newDailyLogs,
          totalCompleted: newTotalCompleted,
          currentStreak,
          longestStreak,
        });
      },

      isCompleted: (sunnahId: string) => {
        return get().completedSunnahs[sunnahId] || false;
      },

      getTodayCompleted: () => {
        const state = get();
        const today = state.getTodayDate();
        return state.dailyLogs[today] || [];
      },

      getCategoryProgress: (categoryId: string, totalInCategory: number) => {
        if (totalInCategory === 0) return 0;
        const state = get();
        const completed = Object.keys(state.completedSunnahs).filter(
          id => id.startsWith(categoryId.replace("-", "").substring(0, 4)) && state.completedSunnahs[id]
        ).length;
        return Math.round((completed / totalInCategory) * 100);
      },

      resetAll: () => {
        set({
          completedSunnahs: {},
          streaks: {},
          lastDoneDates: {},
          dailyLogs: {},
          totalCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
        });
      },
    }),
    {
      name: "sunnah-tracker-storage",
    }
  )
);
