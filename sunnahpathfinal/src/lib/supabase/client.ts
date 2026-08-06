/**
 * Supabase Client — Production-ready Supabase integration
 * 
 * SETUP: Provide these environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...  (server-side only)
 * 
 * Until configured, all functions fall back to localStorage (Zustand)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if Supabase is configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Supabase client singleton (browser-side)
 */
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

/**
 * Auth helpers
 */
export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: new Error("Supabase not configured") };
  return sb.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, string>) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: new Error("Supabase not configured") };
  return sb.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) return { data: null, error: new Error("Supabase not configured") };
  return sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithMagicLink(email: string) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: new Error("Supabase not configured") };
  return sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  return sb.auth.signOut();
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

/**
 * Database helpers — CRUD operations for all SunnahPath data
 */

// ─── Habits ─────────────────────────────────────────────────────────────

export async function upsertHabit(userId: string, habit: {
  sunnah_id: string;
  status: string;
  current_streak: number;
  longest_streak: number;
  total_days: number;
  completed_dates: string[];
  difficulty: string;
  stack_order: number;
  activated_date?: string;
  mastered_date?: string;
  missed_yesterday: boolean;
  pause_count: number;
  intention_id?: string;
}) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("habits").upsert({
    user_id: userId,
    ...habit,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,sunnah_id" });
}

export async function getHabits(userId: string) {
  const sb = getSupabase();
  if (!sb) return { data: [], error: new Error("Not configured") };
  return sb.from("habits").select("*").eq("user_id", userId).order("stack_order");
}

// ─── Daily Logs ────────────────────────────────────────────────────────

export async function upsertDailyLog(userId: string, date: string, completedIds: string[]) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("daily_logs").upsert({
    user_id: userId,
    date,
    completed_sunnah_ids: completedIds,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,date" });
}

export async function getDailyLogs(userId: string, fromDate?: string, toDate?: string) {
  const sb = getSupabase();
  if (!sb) return { data: [], error: new Error("Not configured") };
  let query = sb.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false });
  if (fromDate) query = query.gte("date", fromDate);
  if (toDate) query = query.lte("date", toDate);
  return query;
}

// ─── Reflections ───────────────────────────────────────────────────────

export async function upsertReflection(userId: string, reflection: {
  date: string;
  day_rating: number;
  wins: string[];
  challenges: string[];
  overcome_plan: string;
  gratitude?: string;
  tomorrow_intention?: string;
  completed_sunnah_ids: string[];
  missed_sunnah_ids: string[];
}) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("evening_reflections").upsert({
    user_id: userId,
    ...reflection,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,date" });
}

// ─── Weekly Reviews ────────────────────────────────────────────────────

export async function upsertWeeklyReview(userId: string, review: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("weekly_reviews").upsert({
    user_id: userId,
    ...review,
    updated_at: new Date().toISOString(),
  });
}

// ─── Milestones ────────────────────────────────────────────────────────

export async function insertMilestone(userId: string, milestone: {
  type: string;
  sunnah_id?: string;
  title: string;
  description: string;
  celebrated: boolean;
}) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("milestones").insert({
    user_id: userId,
    ...milestone,
    date: new Date().toISOString().split("T")[0],
  });
}

export async function markMilestoneCelebrated(milestoneId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("milestones").update({ celebrated: true }).eq("id", milestoneId);
}

// ─── Settings ──────────────────────────────────────────────────────────

export async function upsertSettings(userId: string, settings: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("user_settings").upsert({
    user_id: userId,
    settings_json: settings,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

// ─── Commitment Contract ───────────────────────────────────────────────

export async function upsertCommitmentContract(userId: string, contract: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return null;
  return sb.from("commitment_contracts").upsert({
    user_id: userId,
    ...contract,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

// ─── Realtime Subscriptions ────────────────────────────────────────────

export function subscribeToHabits(userId: string, onChange: (payload: unknown) => void) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`habits:${userId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "habits",
      filter: `user_id=eq.${userId}`,
    }, onChange)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

export function subscribeToDailyLogs(userId: string, onChange: (payload: unknown) => void) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`daily_logs:${userId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "daily_logs",
      filter: `user_id=eq.${userId}`,
    }, onChange)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

/**
 * Migration: localStorage → Supabase
 * One-time sync that uploads all existing browser data to the cloud
 */
export async function migrateLocalStorageToSupabase(userId: string) {
  if (typeof window === "undefined") return;

  const storeKeys = [
    "sunnah-habit-engine",
    "sunnah-settings",
    "sunnah-accountability",
    "sunnah-tracker-storage",
  ];

  // Check if migration already done
  const migrationKey = `sunnah-migrated-${userId}`;
  if (localStorage.getItem(migrationKey)) return;

  const sb = getSupabase();
  if (!sb) return;

  // Migrate habits
  const habitData = JSON.parse(localStorage.getItem("sunnah-habit-engine") || "{}");
  if (habitData?.habits) {
    for (const [sunnahId, habit] of Object.entries(habitData.habits as Record<string, Record<string, unknown>>)) {
      await upsertHabit(userId, {
        sunnah_id: sunnahId,
        status: (habit.status as string) || "active",
        current_streak: (habit.currentStreak as number) || 0,
        longest_streak: (habit.longestStreak as number) || 0,
        total_days: (habit.totalDays as number) || 0,
        completed_dates: (habit.completedDates as string[]) || [],
        difficulty: (habit.difficulty as string) || "tiny",
        stack_order: (habit.stackOrder as number) || 1,
        activated_date: habit.activatedDate as string,
        mastered_date: habit.masteredDate as string,
        missed_yesterday: (habit.missedYesterday as boolean) || false,
        pause_count: (habit.pauseCount as number) || 0,
        intention_id: habit.intentionId as string,
      });
    }
  }

  // Migrate daily logs
  const trackerData = JSON.parse(localStorage.getItem("sunnah-tracker-storage") || "{}");
  if (trackerData?.state?.dailyLogs) {
    for (const [date, ids] of Object.entries(trackerData.state.dailyLogs as Record<string, string[]>)) {
      await upsertDailyLog(userId, date, ids);
    }
  }

  // Migrate settings
  const settingsData = JSON.parse(localStorage.getItem("sunnah-settings") || "{}");
  if (settingsData?.state) {
    await upsertSettings(userId, settingsData.state);
  }

  // Mark migration complete
  localStorage.setItem(migrationKey, new Date().toISOString());
}
