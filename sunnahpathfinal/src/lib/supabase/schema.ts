/**
 * Supabase Database Schema
 * ─────────────────────────────────────────────────────────────────────
 * Run this SQL in the Supabase SQL Editor to create all tables.
 * 
 * Also create these RLS policies (every table has: users can only CRUD their own data).
 */

export const SUPABASE_SCHEMA_SQL = `
-- ═══════════════════════════════════════════════════════════════════════
-- SUNNAHPATH — Complete Supabase Schema
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Profiles (extends auth.users) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  keystone_habit_id TEXT,
  current_phase TEXT DEFAULT 'foundation',
  max_active_habits INTEGER DEFAULT 1,
  global_streak INTEGER DEFAULT 0,
  global_longest_streak INTEGER DEFAULT 0,
  never_miss_twice_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Habits ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sunnah_id TEXT NOT NULL,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'active', 'mastered', 'paused')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  completed_dates TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'tiny' CHECK (difficulty IN ('tiny', 'small', 'moderate')),
  stack_order INTEGER DEFAULT 1,
  activated_date DATE,
  mastered_date DATE,
  missed_yesterday BOOLEAN DEFAULT false,
  pause_count INTEGER DEFAULT 0,
  intention_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sunnah_id)
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- ─── Implementation Intentions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.implementation_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sunnah_id TEXT NOT NULL,
  anchor TEXT NOT NULL,
  if_then_plan TEXT,
  anchor_time TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.implementation_intentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own intentions" ON public.implementation_intentions FOR ALL USING (auth.uid() = user_id);

-- ─── Daily Logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed_sunnah_ids TEXT[] DEFAULT '{}',
  self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),
  reflection TEXT,
  obstacle_note TEXT,
  overcome_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own daily logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);

-- ─── Evening Reflections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evening_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  day_rating INTEGER CHECK (day_rating BETWEEN 1 AND 5) NOT NULL,
  wins TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  overcome_plan TEXT DEFAULT '',
  gratitude TEXT,
  tomorrow_intention TEXT,
  completed_sunnah_ids TEXT[] DEFAULT '{}',
  missed_sunnah_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.evening_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own reflections" ON public.evening_reflections FOR ALL USING (auth.uid() = user_id);

-- ─── Weekly Reviews ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_rating INTEGER CHECK (week_rating BETWEEN 1 AND 5) NOT NULL,
  biggest_win TEXT,
  biggest_challenge TEXT,
  next_week_plan TEXT,
  continue_habits TEXT[] DEFAULT '{}',
  adjust_habits TEXT[] DEFAULT '{}',
  new_habit_candidates TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  completion_rate REAL DEFAULT 0,
  streak_at_end INTEGER DEFAULT 0,
  submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own weekly reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id);

-- ─── Milestones ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  sunnah_id TEXT,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  celebrated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own milestones" ON public.milestones FOR ALL USING (auth.uid() = user_id);

-- ─── Commitment Contracts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commitment_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sign_date DATE NOT NULL,
  commitment_text TEXT NOT NULL,
  motivation TEXT,
  consequence TEXT,
  reward TEXT,
  active BOOLEAN DEFAULT true,
  days_since_signed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.commitment_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own contracts" ON public.commitment_contracts FOR ALL USING (auth.uid() = user_id);

-- ─── Violation Logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.violation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sunnah_id TEXT NOT NULL,
  reason TEXT,
  is_double_miss BOOLEAN DEFAULT false,
  recovery_plan TEXT,
  recovered BOOLEAN DEFAULT false,
  recovery_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.violation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own violations" ON public.violation_logs FOR ALL USING (auth.uid() = user_id);

-- ─── User Settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON public.evening_reflections(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.milestones(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_violations_user ON public.violation_logs(user_id, date DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET for avatars
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════
-- REALTIME — Enable for key tables
-- ═══════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evening_reflections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;

-- ═══════════════════════════════════════════════════════════════════════
-- HELPER: updated_at auto-refresh trigger
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evening_reflections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.weekly_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.commitment_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
`;
