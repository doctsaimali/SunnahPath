"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sunnah,
  categories,
  sunnahs,
  getSunnahsByCategory,
  getGradingColor,
  getGradingLabel,
  HadithGrading,
} from "@/data/sunnahs";
import { useHabitEngine, HabitPhase, HabitDifficulty, ImplementationIntention, HabitProgress } from "@/lib/habit-engine";
import { useSettings, HabitPace, DifficultyPreference, ReviewDay, AccountabilityMode } from "@/lib/settings-store";
import { useAccountability, EveningReflection, WeeklyReview, CommitmentContract } from "@/lib/accountability-store";
import { useSunnahTracker } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Droplets, Moon, Sun, Sunset, Bed, UtensilsCrossed, Shirt, Users,
  Home, Heart, Calendar, DoorOpen, Star, CheckCircle2, ChevronDown,
  BookOpen, Search, X, Filter, BookMarked, Quote, Clock, Sparkles,
  ArrowRight, ArrowLeft, Target, Flame, Trophy, Lock, Unlock,
  Settings2, Bell, Eye, Pen, MessageSquare, Shield, Zap, Brain,
  TrendingUp, Award, ClipboardCheck, FileText, AlertTriangle,
  ChevronRight, RotateCcw, Plus, Minus, Handshake, Lightbulb,
  Gem, Crown, Rocket, Compass, Activity, CircleDot, Layers,
  Timer, Flag, HeartHandshake, NotebookPen, ScrollText,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Droplets, Moon, Sun, Sunset, Bed, UtensilsCrossed, Shirt, Users,
  Home, Heart, Calendar, DoorOpen,
};

const timeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  morning: { label: "Morning", icon: Sun },
  afternoon: { label: "Afternoon", icon: Sunset },
  evening: { label: "Evening", icon: Moon },
  night: { label: "Night", icon: Bed },
  anytime: { label: "Any Time", icon: Clock },
};

const phaseInfo: Record<HabitPhase, { label: string; icon: React.ElementType; color: string; description: string }> = {
  foundation: { label: "Foundation", icon: Target, color: "#f59e0b", description: "Master your first keystone habit" },
  stacking: { label: "Stacking", icon: Layers, color: "#8b5cf6", description: "Build habits on top of your keystone" },
  expansion: { label: "Expansion", icon: Compass, color: "#0ea5e9", description: "Expand to new categories" },
  mastery: { label: "Mastery", icon: Crown, color: "#10b981", description: "Master multiple Sunnahs simultaneously" },
};

const difficultyLabels: Record<HabitDifficulty, { label: string; emoji: string; description: string }> = {
  tiny: { label: "Tiny", emoji: "🌱", description: "Takes < 1 minute (e.g., say Bismillah)" },
  small: { label: "Small", emoji: "🌿", description: "Takes 1-5 minutes (e.g., morning du'a)" },
  moderate: { label: "Moderate", emoji: "🌳", description: "Takes 5-15 minutes (e.g., Sunnah prayer)" },
};

const paceLabels: Record<HabitPace, { label: string; description: string; daysPerHabit: number }> = {
  gentle: { label: "Gentle", description: "1 new habit every 2 weeks", daysPerHabit: 14 },
  moderate: { label: "Moderate", description: "1 new habit per week", daysPerHabit: 7 },
  ambitious: { label: "Ambitious", description: "1 new habit every 3 days", daysPerHabit: 3 },
};

// ─── ANCHOR SUGGESTIONS (for Implementation Intentions) ────────────────
const anchorSuggestions = [
  { text: "I wake up", time: "morning", category: "daily" },
  { text: "I brush my teeth", time: "morning", category: "daily" },
  { text: "I make wudu", time: "anytime", category: "prayer" },
  { text: "I hear the adhan", time: "anytime", category: "prayer" },
  { text: "I start eating", time: "anytime", category: "eating" },
  { text: "I finish eating", time: "anytime", category: "eating" },
  { text: "I enter my home", time: "anytime", category: "home" },
  { text: "I leave my home", time: "anytime", category: "home" },
  { text: "I get ready for bed", time: "night", category: "sleeping" },
  { text: "I take a shower", time: "anytime", category: "wudu-purity" },
  { text: "I put on clothes", time: "morning", category: "clothing" },
  { text: "I meet someone", time: "anytime", category: "social" },
  { text: "It is Friday", time: "anytime", category: "friday" },
];

// ─── HABIT ONBOARDING ──────────────────────────────────────────────────

export function HabitOnboarding() {
  const engine = useHabitEngine();
  const settings = useSettings();
  const [step, setStep] = useState(engine.onboardingStep);
  const [selectedKeystone, setSelectedKeystone] = useState<string | null>(engine.keystoneHabitId);
  const [selectedDifficulty, setSelectedDifficulty] = useState<HabitDifficulty>("tiny");
  const [anchor, setAnchor] = useState("");
  const [customAnchor, setCustomAnchor] = useState("");
  const [pace, setPace] = useState<HabitPace>(settings.pace);

  // Sort sunnahs by difficulty (tiny first for keystone selection)
  const easySunnahs = useMemo(() => {
    return sunnahs.filter(s => {
      // In foundation phase, prefer morning & prayer categories
      const isEasyCategory = ["morning-adhkar", "eating", "wudu-purity"].includes(s.category);
      const isShort = s.steps && s.steps.length <= 3;
      return isEasyCategory || isShort;
    }).slice(0, 12);
  }, []);

  const handleSelectKeystone = () => {
    if (!selectedKeystone) return;
    engine.selectKeystoneHabit(selectedKeystone, selectedDifficulty);
    setStep(1);
  };

  const handleSetIntention = () => {
    if (!selectedKeystone) return;
    const finalAnchor = anchor === "custom" ? customAnchor : anchor;
    if (!finalAnchor) return;
    
    const intention: ImplementationIntention = {
      id: `intent-${selectedKeystone}-${Date.now()}`,
      sunnahId: selectedKeystone,
      anchor: finalAnchor,
      ifThenPlan: `After ${finalAnchor}, I will practice the selected Sunnah.`,
      anchorTime: "morning",
      active: true,
    };
    engine.addIntention(intention);
    setStep(2);
  };

  const handleSetPace = () => {
    settings.setPace(pace);
    settings.setMinStreakForNext(paceLabels[pace].daysPerHabit >= 14 ? 7 : paceLabels[pace].daysPerHabit >= 7 ? 3 : 2);
    setStep(3);
  };

  const handleComplete = () => {
    engine.completeOnboardingStep();
    engine.completeOnboardingStep();
    engine.completeOnboardingStep();
    engine.completeOnboardingStep();
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className={`w-2 h-2 rounded-full transition-all ${s <= step ? "bg-amber-500" : "bg-zinc-700"}`} />
        ))}
      </div>

      {/* Step 0: Choose Keystone Habit */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Psychology-Backed Method</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Choose Your Keystone Habit</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              BJ Fogg&apos;s research shows: <strong className="text-zinc-200">start with ONE tiny habit</strong>. 
              A keystone habit creates a cascade — once it sticks, others follow naturally.
            </p>
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-2 justify-center">
            {(Object.entries(difficultyLabels) as [HabitDifficulty, typeof difficultyLabels[HabitDifficulty]][]).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedDifficulty(key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedDifficulty === key
                    ? "bg-amber-600/80 text-white shadow-sm"
                    : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {info.emoji} {info.label}
              </button>
            ))}
          </div>

          {/* Sunnah selection grid */}
          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
            {easySunnahs.map((sunnah) => {
              const category = categories.find(c => c.id === sunnah.category);
              const IconComp = category ? (iconMap[category.icon] || Star) : Star;
              const isSelected = selectedKeystone === sunnah.id;
              return (
                <button
                  key={sunnah.id}
                  onClick={() => setSelectedKeystone(sunnah.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: category.color + "12", color: category.color + "cc" }}>
                        <IconComp className="w-3 h-3" />
                        {category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{sunnah.title}</h3>
                  {sunnah.titleAr && (
                    <p className="text-xs text-zinc-500 mt-0.5" dir="rtl">{sunnah.titleAr}</p>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSelectKeystone}
            disabled={!selectedKeystone}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold transition-all"
          >
            Continue with Keystone Habit
          </button>
        </div>
      )}

      {/* Step 1: Implementation Intention */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400">Implementation Intention</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Create Your &ldquo;If-Then&rdquo; Plan</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Gollwitzer&apos;s research proves: <strong className="text-zinc-200">specific if-then plans are 2-3x more effective</strong> than 
              vague intentions. Link your Sunnah to an existing routine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/40">
            <p className="text-sm text-zinc-300 mb-1 font-medium">
              {sunnahs.find(s => s.id === selectedKeystone)?.title}
            </p>
            <p className="text-xs text-zinc-500 italic">
              &ldquo;After I [anchor], I will practice this Sunnah.&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Choose your anchor routine:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {anchorSuggestions.map((a) => (
                <button
                  key={a.text}
                  onClick={() => { setAnchor(a.text); setCustomAnchor(""); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    anchor === a.text
                      ? "bg-violet-600/30 border border-violet-500/40 text-violet-200"
                      : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  After I <strong>{a.text}</strong>
                </button>
              ))}
              <button
                onClick={() => setAnchor("custom")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  anchor === "custom"
                    ? "bg-violet-600/30 border border-violet-500/40 text-violet-200"
                    : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Custom anchor...
              </button>
              {anchor === "custom" && (
                <input
                  type="text"
                  value={customAnchor}
                  onChange={(e) => setCustomAnchor(e.target.value)}
                  placeholder="After I..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              )}
            </div>
          </div>

          <button
            onClick={handleSetIntention}
            disabled={!anchor || (anchor === "custom" && !customAnchor)}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold transition-all"
          >
            Set My Intention
          </button>
        </div>
      )}

      {/* Step 2: Pace Setting */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Your Pace</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Choose Your Building Pace</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              <strong className="text-zinc-200">Atomic Habits</strong> principle: don&apos;t rush. 
              Build one habit solid before adding the next. Slow is smooth, smooth is fast.
            </p>
          </div>

          <div className="space-y-2">
            {(Object.entries(paceLabels) as [HabitPace, typeof paceLabels[HabitPace]][]).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setPace(key)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                  pace === key
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">{info.label}</h3>
                  <span className="text-xs text-zinc-500">{info.daysPerHabit} days/habit</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{info.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleSetPace}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
          >
            Set My Pace
          </button>
        </div>
      )}

      {/* Step 3: Summary & Commitment */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Commitment</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Your Habit Plan</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Review your plan. Research shows that <strong className="text-zinc-200">writing down your commitment 
              increases follow-through by 42%</strong>.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Keystone</span>
            </div>
            <p className="text-sm text-zinc-200 font-medium">
              {sunnahs.find(s => s.id === selectedKeystone)?.title}
            </p>

            <Separator className="bg-zinc-800/40" />

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Intention</span>
            </div>
            <p className="text-sm text-zinc-300 italic">
              &ldquo;After {anchor === "custom" ? customAnchor : anchor}, I will practice this Sunnah.&rdquo;
            </p>

            <Separator className="bg-zinc-800/40" />

            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pace</span>
            </div>
            <p className="text-sm text-zinc-200">{paceLabels[pace].label} — {paceLabels[pace].description}</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/80 text-center">
              &ldquo;Verily, the most beloved of deeds to Allah are those done consistently, even if they are small.&rdquo;
              <br />
              <span className="text-amber-500/60">— Sahih al-Bukhari 6464</span>
            </p>
          </div>

          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            Begin My Journey
          </button>
        </div>
      )}
    </div>
  );
}

// ─── STREAK DASHBOARD (Seinfeld Chain + Never Miss Twice) ──────────────

export function StreakDashboard() {
  const engine = useHabitEngine();
  const activeHabits = useMemo(() =>
    Object.values(engine.habits).filter(h => h.status === "active" || h.status === "mastered"),
    [engine.habits]
  );

  // Generate last 30 days for the chain
  const chainDays = useMemo(() => {
    const days: { date: string; dayLabel: string; completed: boolean; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      const anyCompleted = activeHabits.some(h => h.completedDates.includes(dateStr));
      
      days.push({
        date: dateStr,
        dayLabel: dayNames[d.getDay()],
        completed: anyCompleted,
        isToday: i === 0,
      });
    }
    return days;
  }, [activeHabits]);

  const phase = phaseInfo[engine.currentPhase];

  return (
    <div className="space-y-4">
      {/* Phase & Global Streak */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="col-span-1 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <phase.icon className="w-3 h-3" style={{ color: phase.color }} />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Phase</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{phase.label}</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Streak</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{engine.globalStreak}d</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Best</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">{engine.globalLongestStreak}d</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Mastered</span>
          </div>
          <p className="text-sm font-bold text-zinc-200">
            {Object.values(engine.habits).filter(h => h.status === "mastered").length}
          </p>
        </div>
      </div>

      {/* Seinfeld Chain — 30-day visual */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-amber-500/60" />
            Don&apos;t Break the Chain
          </h4>
          <span className="text-[10px] text-zinc-600">Last 30 days</span>
        </div>
        <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
          {chainDays.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              <div
                className={`w-full aspect-square rounded-sm transition-all ${
                  day.completed
                    ? "bg-emerald-500/80"
                    : day.isToday
                      ? "bg-amber-500/30 border border-amber-500/40"
                      : "bg-zinc-800/40"
                }`}
                title={`${day.date}: ${day.completed ? "Done" : "Missed"}`}
              />
              <span className={`text-[7px] ${day.isToday ? "text-amber-400 font-bold" : "text-zinc-600"}`}>
                {day.dayLabel}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          🔗 Each green box = at least 1 Sunnah completed. Don&apos;t break the chain!
        </p>
      </div>

      {/* Active Habit Streaks */}
      {activeHabits.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-2">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-500/60" />
            Active Habit Streaks
          </h4>
          {activeHabits.map((habit) => {
            const sunnah = sunnahs.find(s => s.id === habit.sunnahId);
            if (!sunnah) return null;
            const pct = Math.min(100, (habit.currentStreak / 7) * 100);
            return (
              <div key={habit.sunnahId} className="flex items-center gap-3">
                <span className="text-xs text-zinc-300 flex-1 truncate">{sunnah.title}</span>
                <Progress value={pct} className="w-20 h-1.5" />
                <span className={`text-xs font-bold ${habit.currentStreak >= 7 ? "text-emerald-400" : "text-amber-400"}`}>
                  {habit.currentStreak}d
                </span>
                {habit.status === "mastered" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── HABIT CARD (enhanced with habit engine) ───────────────────────────

export function HabitSunnahCard({ sunnah }: { sunnah: Sunnah }) {
  const [open, setOpen] = useState(false);
  const tracker = useSunnahTracker();
  const engine = useHabitEngine();
  const settings = useSettings();
  
  const completed = tracker.isCompleted(sunnah.id);
  const habit = engine.getHabitProgress(sunnah.id);
  const category = categories.find(c => c.id === sunnah.category);
  const IconComp = category ? (iconMap[category.icon] || Star) : Star;
  const timeInfo = timeLabels[sunnah.timeOfDay];
  const TimeIcon = timeInfo.icon;
  
  const isLocked = !habit || habit.status === "locked";
  const isActive = habit?.status === "active";
  const isMastered = habit?.status === "mastered";
  const isPaused = habit?.status === "paused";
  const intention = engine.intentions.find(i => i.sunnahId === sunnah.id && i.active);

  const uniqueGradings = [...new Set(sunnah.references.map(r => r.grading))];
  const bestGrading = uniqueGradings.includes("Sahih") ? "Sahih" : uniqueGradings[0];

  const handleToggle = () => {
    tracker.toggleSunnah(sunnah.id);
    if (!completed) {
      engine.markHabitDone(sunnah.id);
    }
  };

  return (
    <div className={`group relative rounded-xl border transition-all duration-200 ${
      isLocked
        ? "border-zinc-800/30 bg-zinc-950/40 opacity-50"
        : isPaused
          ? "border-amber-800/30 bg-amber-950/10"
          : isMastered
            ? "border-emerald-800/50 bg-emerald-950/20"
            : completed
              ? "border-emerald-800/50 bg-emerald-950/20"
              : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 hover:bg-zinc-900/60"
    }`}>
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-zinc-600" />
        </div>
      )}

      {/* Paused badge */}
      {isPaused && (
        <div className="absolute top-3 right-3">
          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">PAUSED</span>
        </div>
      )}

      {/* Mastered badge */}
      {isMastered && (
        <div className="absolute top-3 right-3">
          <Crown className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      <button
        onClick={() => !isLocked && setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        disabled={isLocked}
      >
        {/* Checkbox */}
        <span
          onClick={(e) => { e.stopPropagation(); if (!isLocked) handleToggle(); }}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
            completed
              ? "bg-emerald-600 border-emerald-600 text-white"
              : isLocked
                ? "border-zinc-700 cursor-not-allowed"
                : "border-zinc-600 hover:border-zinc-400"
          }`}
        >
          {completed && <CheckCircle2 className="w-3.5 h-3.5" />}
        </span>

        <div className="flex-1 min-w-0">
          {/* Top row: category + time + grading + streak */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: category.color + "12", color: category.color + "cc" }}>
                <IconComp className="w-3 h-3" />
                {category.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <TimeIcon className="w-3 h-3" />
              {timeInfo.label}
            </span>
            {settings.showGradingBadges && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: getGradingColor(bestGrading as HadithGrading) + "15",
                  color: getGradingColor(bestGrading as HadithGrading),
                }}
              >
                {bestGrading === "Sahih" && <CheckCircle2 className="w-3 h-3" />}
                {bestGrading}
              </span>
            )}
            {/* Streak badge */}
            {habit && habit.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
                <Flame className="w-3 h-3" />
                {habit.currentStreak}d
              </span>
            )}
          </div>
          {/* Title */}
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{sunnah.title}</h3>
          {settings.showArabic && sunnah.titleAr && (
            <p className="text-xs text-zinc-500 mt-0.5 font-medium" dir="rtl">{sunnah.titleAr}</p>
          )}
          {/* Implementation intention preview */}
          {intention && settings.showIntentionPrompts && (
            <p className="text-[10px] text-violet-400/70 mt-1 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              After {intention.anchor}...
            </p>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-zinc-600 mt-1 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable Content */}
      {open && !isLocked && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-800/40 pt-4">
          <p className="text-sm text-zinc-400 leading-relaxed">{sunnah.description}</p>

          {/* Implementation Intention */}
          {intention && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-violet-500/60" />
                My If-Then Plan
              </h4>
              <div className="border-l-2 border-violet-600/30 pl-4 py-1">
                <p className="text-sm text-violet-300 italic leading-relaxed">
                  &ldquo;After {intention.anchor}, I will practice this Sunnah.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Hadith Text */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Quote className="w-3 h-3 text-amber-500/60" />
              Hadith
            </h4>
            <div className="border-l-2 border-amber-600/30 pl-4 py-1">
              <p className="text-sm text-zinc-200 italic leading-relaxed">{sunnah.hadithText}</p>
            </div>
          </div>

          {/* References */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookMarked className="w-3 h-3 text-emerald-500/60" />
              References
            </h4>
            <div className="space-y-1">
              {sunnah.references.map((ref, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs bg-zinc-800/30 rounded-lg px-3 py-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: getGradingColor(ref.grading) + "18",
                      color: getGradingColor(ref.grading),
                    }}
                  >
                    {ref.grading}
                  </span>
                  <span className="text-zinc-400">
                    <span className="font-medium text-zinc-200">{ref.book}</span>
                    {ref.volume && <> Vol.{ref.volume}</>}
                    {ref.hadithNumber && <> #{ref.hadithNumber}</>}
                    {ref.number && <> #{ref.number}</>}
                    {ref.narrator && <span className="text-zinc-500"> — {ref.narrator}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          {sunnah.steps && sunnah.steps.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                How to Practice
              </h4>
              <ol className="space-y-1">
                {sunnah.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-zinc-400">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Benefits */}
          {sunnah.benefits && sunnah.benefits.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500/60" />
                Benefits
              </h4>
              <ul className="space-y-1">
                {sunnah.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs text-zinc-400">
                    <span className="text-amber-600/60 mt-0.5">✦</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Habit Stats */}
          {habit && (
            <>
              <Separator className="bg-zinc-800/40" />
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-zinc-800/20">
                  <p className="text-sm font-bold text-amber-400">{habit.currentStreak}</p>
                  <p className="text-[9px] text-zinc-600">Day Streak</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-800/20">
                  <p className="text-sm font-bold text-zinc-300">{habit.totalDays}</p>
                  <p className="text-[9px] text-zinc-600">Total Days</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-800/20">
                  <p className="text-sm font-bold text-emerald-400">{habit.longestStreak}</p>
                  <p className="text-[9px] text-zinc-600">Best Streak</p>
                </div>
              </div>
              {/* Pause/Resume button */}
              {settings.allowPausing && isActive && (
                <button
                  onClick={() => engine.pauseHabit(sunnah.id)}
                  className="text-xs text-amber-500/60 hover:text-amber-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Pause this habit
                </button>
              )}
              {isPaused && (
                <button
                  onClick={() => engine.resumeHabit(sunnah.id)}
                  className="text-xs text-emerald-500/60 hover:text-emerald-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resume this habit
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EVENING REFLECTION COMPONENT ──────────────────────────────────────

export function EveningReflection() {
  const accountability = useAccountability();
  const engine = useHabitEngine();
  const today = new Date().toISOString().split("T")[0];
  const existing = accountability.getReflectionForDate(today);
  
  const [dayRating, setDayRating] = useState(existing?.dayRating || 0);
  const [wins, setWins] = useState<string[]>(existing?.wins || []);
  const [challenges, setChallenges] = useState<string[]>(existing?.challenges || []);
  const [overcomePlan, setOvercomePlan] = useState(existing?.overcomePlan || "");
  const [gratitude, setGratitude] = useState(existing?.gratitude || "");
  const [tomorrowIntention, setTomorrowIntention] = useState(existing?.tomorrowIntention || "");
  const [newWin, setNewWin] = useState("");
  const [newChallenge, setNewChallenge] = useState("");

  const activeHabitIds = Object.values(engine.habits)
    .filter(h => h.status === "active" || h.status === "mastered")
    .map(h => h.sunnahId);
  const completedToday = activeHabitIds.filter(id => {
    const h = engine.habits[id];
    return h?.completedDates.includes(today);
  });

  const handleSubmit = () => {
    const reflection: EveningReflection = {
      date: today,
      dayRating,
      wins,
      challenges,
      overcomePlan,
      gratitude,
      tomorrowIntention,
      completedSunnahIds: completedToday,
      missedSunnahIds: activeHabitIds.filter(id => !completedToday.includes(id)),
    };
    accountability.submitEveningReflection(reflection);
  };

  return (
    <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-4">
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-bold text-zinc-200">Evening Reflection</h3>
        <span className="text-[10px] text-zinc-600 ml-auto">{today}</span>
      </div>

      {/* Day Rating */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">How was your day?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setDayRating(r)}
              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                dayRating === r
                  ? r >= 4 ? "bg-emerald-600/60 text-white" : r >= 3 ? "bg-amber-600/60 text-white" : "bg-red-600/60 text-white"
                  : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Wins */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">What went well?</p>
        {wins.map((w, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {w}
            <button onClick={() => setWins(wins.filter((_, j) => j !== i))} className="ml-auto text-zinc-600 hover:text-zinc-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newWin}
            onChange={(e) => setNewWin(e.target.value)}
            placeholder="Add a win..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newWin) {
                setWins([...wins, newWin]);
                setNewWin("");
              }
            }}
          />
          <button onClick={() => { if (newWin) { setWins([...wins, newWin]); setNewWin(""); } }} className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">What was challenging?</p>
        {challenges.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            {c}
            <button onClick={() => setChallenges(challenges.filter((_, j) => j !== i))} className="ml-auto text-zinc-600 hover:text-zinc-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newChallenge}
            onChange={(e) => setNewChallenge(e.target.value)}
            placeholder="Add a challenge..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newChallenge) {
                setChallenges([...challenges, newChallenge]);
                setNewChallenge("");
              }
            }}
          />
          <button onClick={() => { if (newChallenge) { setChallenges([...challenges, newChallenge]); setNewChallenge(""); } }} className="px-2 py-1 rounded-lg bg-amber-600/20 text-amber-400">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Overcome Plan */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">How will you overcome challenges?</p>
        <textarea
          value={overcomePlan}
          onChange={(e) => setOvercomePlan(e.target.value)}
          placeholder="My plan to overcome..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
        />
      </div>

      {/* Gratitude & Tomorrow */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600">Gratitude</p>
          <input
            type="text"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="Alhamdulillah for..."
            className="w-full px-2 py-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600">Tomorrow&apos;s intention</p>
          <input
            type="text"
            value={tomorrowIntention}
            onChange={(e) => setTomorrowIntention(e.target.value)}
            placeholder="I will..."
            className="w-full px-2 py-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={dayRating === 0}
        className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold transition-all"
      >
        Save Evening Reflection
      </button>
    </div>
  );
}

// ─── WEEKLY REVIEW COMPONENT ───────────────────────────────────────────

export function WeeklyReviewPanel() {
  const accountability = useAccountability();
  const engine = useHabitEngine();
  const [weekRating, setWeekRating] = useState(0);
  const [biggestWin, setBiggestWin] = useState("");
  const [biggestChallenge, setBiggestChallenge] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  };

  const weekDates = getWeekDates();

  // Calculate week stats
  const activeHabits = Object.values(engine.habits).filter(h => h.status === "active" || h.status === "mastered");
  const completedThisWeek = activeHabits.filter(h =>
    h.completedDates.some(d => d >= weekDates.start && d <= weekDates.end)
  );
  const completionRate = activeHabits.length > 0 ? Math.round((completedThisWeek.length / activeHabits.length) * 100) : 0;

  const handleSubmit = () => {
    const review: WeeklyReview = {
      id: `review-${weekDates.start}`,
      weekStart: weekDates.start,
      weekEnd: weekDates.end,
      weekRating,
      biggestWin,
      biggestChallenge,
      nextWeekPlan,
      continueHabits: activeHabits.filter(h => h.currentStreak >= 3).map(h => h.sunnahId),
      adjustHabits: activeHabits.filter(h => h.currentStreak < 3).map(h => h.sunnahId),
      newHabitCandidates: [],
      notes,
      completionRate,
      streakAtEnd: engine.globalStreak,
      submitted: true,
    };
    accountability.submitWeeklyReview(review);
    setSubmitted(true);
  };

  return (
    <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-4">
      <div className="flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-zinc-200">Weekly Review</h3>
        <span className="text-[10px] text-zinc-600 ml-auto">
          {weekDates.start} → {weekDates.end}
        </span>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-emerald-400 font-medium">Review submitted!</p>
          <p className="text-xs text-zinc-500 mt-1">See you next week inshaAllah</p>
        </div>
      ) : (
        <>
          {/* Completion rate */}
          <div className="p-3 rounded-lg bg-zinc-800/20 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-zinc-500 mb-1">Week Completion</p>
              <Progress value={completionRate} className="h-2" />
            </div>
            <span className="text-sm font-bold text-amber-400">{completionRate}%</span>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Overall week rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setWeekRating(r)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    weekRating === r ? "bg-amber-600/60 text-white" : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Structured questions */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">🏆 Biggest win this week</p>
              <input type="text" value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)}
                placeholder="What went best..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">⚡ Biggest challenge</p>
              <input type="text" value={biggestChallenge} onChange={(e) => setBiggestChallenge(e.target.value)}
                placeholder="What was hardest..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">🎯 Plan for next week</p>
              <textarea value={nextWeekPlan} onChange={(e) => setNextWeekPlan(e.target.value)}
                placeholder="What will I adjust..." rows={2} className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">📝 Additional notes</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any reflections..." rows={2} className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={weekRating === 0}
            className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold transition-all"
          >Submit Weekly Review</button>
        </>
      )}
    </div>
  );
}

// ─── COMMITMENT CONTRACT ───────────────────────────────────────────────

export function CommitmentContractPanel() {
  const accountability = useAccountability();
  const contract = accountability.commitmentContract;
  const [motivation, setMotivation] = useState("");
  const [consequence, setConsequence] = useState("");
  const [reward, setReward] = useState("");
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    const today = new Date().toISOString().split("T")[0];
    accountability.signCommitmentContract({
      signDate: today,
      commitmentText: "I commit to practicing my daily Sunnahs consistently, starting with my keystone habit and building one habit at a time. I will follow the 'never miss twice' rule and review my progress weekly.",
      motivation,
      consequence,
      reward,
      active: true,
      daysSinceSigned: 0,
    });
    setSigned(true);
  };

  if (contract) {
    return (
      <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300">Commitment Contract</h3>
        </div>
        <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{contract.commitmentText}&rdquo;</p>
        <Separator className="bg-zinc-800/40" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-zinc-600">Motivation</p>
            <p className="text-zinc-300">{contract.motivation}</p>
          </div>
          <div>
            <p className="text-zinc-600">Reward</p>
            <p className="text-zinc-300">{contract.reward}</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600">Signed: {contract.signDate}</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/30 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-zinc-200">Commitment Contract</h3>
      </div>
      <p className="text-xs text-zinc-400">
        Research shows writing a commitment increases follow-through by 42%. Sign your personal contract below.
      </p>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">Why are you doing this? (Your &ldquo;why&rdquo;)</p>
          <input type="text" value={motivation} onChange={(e) => setMotivation(e.target.value)}
            placeholder="To follow the Prophet ﷺ more closely..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">If I don&apos;t follow through, I will...</p>
          <input type="text" value={consequence} onChange={(e) => setConsequence(e.target.value)}
            placeholder="Donate $X to charity..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">When I stay consistent, I will reward myself with...</p>
          <input type="text" value={reward} onChange={(e) => setReward(e.target.value)}
            placeholder="A special treat every 30-day streak..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
        </div>
      </div>
      <button onClick={handleSign} disabled={!motivation}
        className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold transition-all"
      >
        Sign My Commitment
      </button>
    </div>
  );
}

// ─── SETTINGS PANEL ────────────────────────────────────────────────────

export function SettingsPanel() {
  const settings = useSettings();
  const engine = useHabitEngine();
  const [tab, setTab] = useState<"pace" | "schedule" | "accountability" | "display" | "streaks">("pace");

  const tabs = [
    { key: "pace" as const, label: "Pace", icon: Timer },
    { key: "schedule" as const, label: "Schedule", icon: Bell },
    { key: "accountability" as const, label: "Accountability", icon: Shield },
    { key: "display" as const, label: "Display", icon: Eye },
    { key: "streaks" as const, label: "Streaks", icon: Flame },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
              tab === t.key ? "bg-amber-600/80 text-white" : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Pace Settings */}
      {tab === "pace" && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Habit Building Pace</h4>
          {(Object.entries(paceLabels) as [HabitPace, typeof paceLabels[HabitPace]][]).map(([key, info]) => (
            <button key={key} onClick={() => settings.setPace(key)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                settings.pace === key ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">{info.label}</span>
                <span className="text-xs text-zinc-500">{info.daysPerHabit}d/habit</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{info.description}</p>
            </button>
          ))}

          <Separator className="bg-zinc-800/40" />

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Difficulty Strategy</p>
            {([
              ["easiest_first", "Easiest First", "Start with the simplest Sunnahs"],
              ["most_impactful", "Most Impactful", "Prioritize high-impact daily Sunnahs"],
              ["chronological", "Chronological", "Follow the day&apos;s natural order"],
            ] as const).map(([key, label, desc]) => (
              <button key={key} onClick={() => settings.setDifficultyPreference(key as DifficultyPreference)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  settings.difficultyPreference === key ? "bg-zinc-800/60 text-zinc-200" : "bg-zinc-900/30 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className="font-medium">{label}</span> — <span className="text-zinc-400">{desc}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Min streak before next habit</p>
              <span className="text-xs font-bold text-amber-400">{settings.minStreakForNext} days</span>
            </div>
            <Slider
              value={[settings.minStreakForNext]}
              onValueChange={([v]) => settings.setMinStreakForNext(v)}
              min={1} max={14} step={1}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Schedule Settings */}
      {tab === "schedule" && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Reminders & Schedule</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Day starts at</p>
              <span className="text-xs font-bold text-zinc-300">{settings.dayStartTime}:00</span>
            </div>
            <Slider
              value={[settings.dayStartTime]}
              onValueChange={([v]) => settings.setDayStartTime(v)}
              min={0} max={12} step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Weekly review day</p>
            <div className="flex flex-wrap gap-1.5">
              {(["friday", "saturday", "sunday", "monday"] as ReviewDay[]).map((day) => (
                <button key={day} onClick={() => settings.setReviewDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.reviewDay === day ? "bg-amber-600/60 text-white" : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800/40" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Reminder Times</p>
              <button onClick={() => settings.addReminder({ hour: 12, minute: 0, enabled: true, label: "New Reminder" })}
                className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {settings.reminders.map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/20">
                <Switch checked={r.enabled} onCheckedChange={(v) => settings.updateReminder(i, { ...r, enabled: v })} />
                <span className="text-xs text-zinc-300 flex-1">{r.label}</span>
                <span className="text-xs text-zinc-500">{r.hour}:{r.minute.toString().padStart(2, "0")}</span>
                <button onClick={() => settings.removeReminder(i)} className="text-zinc-600 hover:text-zinc-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accountability Settings */}
      {tab === "accountability" && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Accountability</h4>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Accountability mode</p>
            {([
              ["self", "Self-Accountability", "You hold yourself accountable through reflections and reviews"],
              ["partner", "Accountability Partner", "Share progress with a trusted friend or family member"],
              ["community", "Community", "Join a Sunnah practice community for mutual support"],
            ] as const).map(([key, label, desc]) => (
              <button key={key} onClick={() => settings.setAccountabilityMode(key as AccountabilityMode)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  settings.accountabilityMode === key ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60"
                }`}
              >
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {settings.accountabilityMode === "partner" && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">Partner&apos;s name</p>
              <input type="text" value={settings.partnerName} onChange={(e) => settings.setPartnerName(e.target.value)}
                placeholder="Their name..." className="w-full px-3 py-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
            </div>
          )}

          <Separator className="bg-zinc-800/40" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-300">Show commitment contract</p>
                <p className="text-[10px] text-zinc-600">Sign a personal commitment for higher follow-through</p>
              </div>
              <Switch checked={settings.showCommitmentContract} onCheckedChange={settings.setShowCommitmentContract} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-300">Require daily reflection</p>
                <p className="text-[10px] text-zinc-600">Must complete evening reflection before marking day done</p>
              </div>
              <Switch checked={settings.requireDailyReflection} onCheckedChange={settings.setRequireDailyReflection} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-300">Weekly reviews</p>
                <p className="text-[10px] text-zinc-600">Structured weekly reflection and planning</p>
              </div>
              <Switch checked={settings.weeklyReviewEnabled} onCheckedChange={settings.setWeeklyReviewEnabled} />
            </div>
          </div>
        </div>
      )}

      {/* Display Settings */}
      {tab === "display" && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Display & UX</h4>
          <div className="space-y-3">
            {([
              ["showArabic", "Show Arabic text", "Display Arabic titles alongside English"],
              ["showGradingBadges", "Show grading badges", "Display hadith authentication level"],
              ["compactMode", "Compact cards", "Show more sunnahs with less space"],
              ["celebrateAnimations", "Celebration animations", "Animate milestone achievements"],
              ["showIntentionPrompts", "Implementation intention prompts", "Show if-then plan on each habit card"],
            ] as const).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-300">{label}</p>
                  <p className="text-[10px] text-zinc-600">{desc}</p>
                </div>
                <Switch
                  checked={settings[key as keyof typeof settings] as boolean}
                  onCheckedChange={(v) => {
                    const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof settings;
                    if (typeof settings[setter] === "function") {
                      (settings[setter] as (v: boolean) => void)(v);
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <Separator className="bg-zinc-800/40" />

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Focus Categories (shown first)</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isFocus = settings.focusCategories.includes(cat.id);
                const isHidden = settings.hiddenCategories.includes(cat.id);
                return (
                  <button key={cat.id}
                    onClick={() => {
                      if (isFocus) {
                        settings.setFocusCategories(settings.focusCategories.filter(c => c !== cat.id));
                      } else {
                        settings.setFocusCategories([...settings.focusCategories, cat.id]);
                      }
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      isFocus ? "bg-amber-600/60 text-white" : isHidden ? "bg-zinc-800/20 text-zinc-700 line-through" : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Streak Rules */}
      {tab === "streaks" && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Streak Rules</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-300">&ldquo;Never Miss Twice&rdquo; Rule</p>
              <p className="text-[10px] text-zinc-600">If you miss one day, you MUST do it the next day. Missing two in a row resets your streak.</p>
            </div>
            <Switch checked={settings.neverMissTwiceRule} onCheckedChange={settings.setNeverMissTwiceRule} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Mastery threshold</p>
              <span className="text-xs font-bold text-emerald-400">{settings.masteryThreshold} days</span>
            </div>
            <Slider
              value={[settings.masteryThreshold]}
              onValueChange={([v]) => settings.setMasteryThreshold(v)}
              min={3} max={66} step={1}
              className="w-full"
            />
            <p className="text-[10px] text-zinc-600">
              Days of consistent practice before a habit is considered &ldquo;mastered&rdquo;. Default: 7 (research range: 21-66).
            </p>
          </div>

          <Separator className="bg-zinc-800/40" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-300">Allow pausing habits</p>
              <p className="text-[10px] text-zinc-600">Sometimes life happens. Allow temporarily pausing a habit.</p>
            </div>
            <Switch checked={settings.allowPausing} onCheckedChange={settings.setAllowPausing} />
          </div>

          {settings.allowPausing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">Max pauses before warning</p>
                <span className="text-xs font-bold text-amber-400">{settings.maxPausesBeforeWarning}</span>
              </div>
              <Slider
                value={[settings.maxPausesBeforeWarning]}
                onValueChange={([v]) => settings.setMaxPausesBeforeWarning(v)}
                min={1} max={10} step={1}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MILESTONE CELEBRATION ──────────────────────────────────────────────

export function MilestoneCelebration() {
  const engine = useHabitEngine();
  const uncelebrated = engine.milestones.filter(m => !m.celebrated);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(uncelebrated.length > 0);

  if (!visible || uncelebrated.length === 0 || current >= uncelebrated.length) return null;

  const milestone = uncelebrated[current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-sm mx-4 p-8 rounded-2xl bg-zinc-900 border border-amber-500/30 text-center space-y-4 shadow-2xl shadow-amber-500/10">
        <div className="text-4xl mb-2">
          {milestone.type.includes("streak") ? "🔥" : milestone.type === "phase_advance" ? "🚀" : milestone.type === "all_mastered" ? "🏆" : "⭐"}
        </div>
        <h2 className="text-xl font-bold text-amber-300">{milestone.title}</h2>
        <p className="text-sm text-zinc-400">{milestone.description}</p>
        <p className="text-xs text-zinc-600">{milestone.date}</p>
        <button
          onClick={() => {
            // Mark as celebrated
            const updated = engine.milestones.map(m =>
              m.id === milestone.id ? { ...m, celebrated: true } : m
            );
            setCurrent(current + 1);
            if (current + 1 >= uncelebrated.length) {
              setVisible(false);
            }
          }}
          className="px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all"
        >
          Alhamdulillah! ✨
        </button>
      </div>
    </div>
  );
}

// ─── ACTIVATE NEXT HABIT BUTTON ────────────────────────────────────────

export function ActivateNextHabitButton() {
  const engine = useHabitEngine();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<HabitDifficulty>("tiny");

  const canActivate = engine.canActivateHabit();
  const activeOrMasteredIds = new Set(
    Object.values(engine.habits)
      .filter(h => h.status === "active" || h.status === "mastered" || h.status === "paused")
      .map(h => h.sunnahId)
  );
  const availableSunnahs = sunnahs.filter(s => !activeOrMasteredIds.has(s.id));

  if (!canActivate || availableSunnahs.length === 0) {
    // Show why they can't add yet
    const activeHabits = Object.values(engine.habits).filter(h => h.status === "active");
    const hasSufficientStreak = activeHabits.some(h => h.currentStreak >= 3);
    
    return (
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-zinc-600" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Next Habit Locked</h4>
        </div>
        {!hasSufficientStreak && activeHabits.length > 0 ? (
          <p className="text-xs text-zinc-500">
            Build a <strong className="text-amber-400">3-day streak</strong> on your current habit first. 
            This ensures solid foundations before adding more.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            You&apos;ve reached the max active habits for your phase. 
            Master your current habits to unlock more slots.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-400">Add Next Habit (One at a Time)</span>
      </button>

      {showPicker && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/30 space-y-3 max-h-[400px] overflow-y-auto">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Choose your next habit</h4>
          
          {/* Difficulty filter */}
          <div className="flex gap-1.5">
            {(Object.entries(difficultyLabels) as [HabitDifficulty, typeof difficultyLabels[HabitDifficulty]][]).map(([key, info]) => (
              <button key={key} onClick={() => setSelectedDifficulty(key)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  selectedDifficulty === key ? "bg-amber-600/60 text-white" : "bg-zinc-800/40 text-zinc-500"
                }`}
              >
                {info.emoji} {info.label}
              </button>
            ))}
          </div>

          {/* Available sunnahs */}
          <div className="space-y-1.5">
            {availableSunnahs.slice(0, 15).map((s) => {
              const cat = categories.find(c => c.id === s.category);
              const IconComp = cat ? (iconMap[cat.icon] || Star) : Star;
              return (
                <button key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                    selectedId === s.id ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800/40 bg-zinc-900/30 hover:border-zinc-700/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {cat && <IconComp className="w-3 h-3" style={{ color: cat.color + "99" }} />}
                    <span className="text-[10px] text-zinc-500">{cat?.name}</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-200">{s.title}</p>
                </button>
              );
            })}
          </div>

          {selectedId && (
            <button
              onClick={() => {
                engine.activateNextHabit(selectedId, selectedDifficulty);
                setShowPicker(false);
                setSelectedId(null);
              }}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all"
            >
              Activate This Habit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GRADING LEGEND ────────────────────────────────────────────────────

export function GradingLegend() {
  const gradings: HadithGrading[] = ["Sahih", "Hasan", "Hasan li Ghairihi", "Sahih li Ghairihi", "Mutawatir", "Mawquf", "Da'if"];
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center py-6">
      {gradings.map((g) => (
        <span key={g}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-900/60 border border-zinc-800/40"
          style={{ color: getGradingColor(g) }}
        >
          {g === "Sahih" && <CheckCircle2 className="w-3 h-3" />}
          {g === "Hasan" && <Star className="w-3 h-3" />}
          {g === "Hasan li Ghairihi" && <Star className="w-3 h-3" />}
          {g}
        </span>
      ))}
    </div>
  );
}
