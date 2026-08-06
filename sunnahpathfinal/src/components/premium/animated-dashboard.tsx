"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ConfettiCelebration, MilestonePopup } from "./confetti";
import { AnimatedCounter } from "./animated-counter";
import { AnimatedProgressRing, AnimatedProgressBar } from "./animated-progress";
import { GlassmorphismCard, GlowText } from "./glass-cards";
import { PulseIndicator, AnimatedToggle, PageTransition, StaggerList, StaggerItem, AnimatedTab } from "./transitions";
import { useHabitEngine } from "@/lib/habit-engine";
import { useSunnahTracker } from "@/lib/store";
import { useSettings } from "@/lib/settings-store";
import { sunnahs, categories } from "@/data/sunnahs";
import {
  Flame, Crown, Zap, Target, Activity, Trophy, Shield, Star,
  CheckCircle2, TrendingUp, Lock, Unlock, Layers, Compass,
  Sparkles, Award, Rocket, CircleDot,
} from "lucide-react";

/**
 * AnimatedStreakDashboard — Premium streak dashboard with live animations
 * Replaces the static StreakDashboard with animated version
 */
export function AnimatedStreakDashboard() {
  const engine = useHabitEngine();
  const tracker = useSunnahTracker();
  const settings = useSettings();

  const activeHabits = Object.values(engine.habits).filter(h => h.status === "active");
  const masteredHabits = Object.values(engine.habits).filter(h => h.status === "mastered");
  const totalActiveMastered = activeHabits.length + masteredHabits.length;

  // Chain data for last 30 days
  const chainDays = (() => {
    const days: { date: string; dayLabel: string; completed: boolean; isToday: boolean; count: number }[] = [];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = [...activeHabits, ...masteredHabits].filter(h => h.completedDates.includes(dateStr)).length;
      days.push({
        date: dateStr,
        dayLabel: dayNames[d.getDay()],
        completed: count > 0,
        isToday: i === 0,
        count,
      });
    }
    return days;
  })();

  const phaseColors: Record<string, string> = {
    foundation: "#f59e0b",
    stacking: "#8b5cf6",
    expansion: "#0ea5e9",
    mastery: "#10b981",
  };
  const phaseColor = phaseColors[engine.currentPhase] || "#f59e0b";

  // Completion percentage
  const totalSunnahs = sunnahs.length;
  const completionPct = totalActiveMastered > 0 ? Math.round((totalActiveMastered / totalSunnahs) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Hero stats row with glassmorphism */}
      <StaggerList className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StaggerItem>
          <GlassmorphismCard glowColor={phaseColor} intensity="low">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <PulseIndicator color={phaseColor} size={6} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Phase</span>
              </div>
              <GlowText color={phaseColor} className="text-sm font-bold">
                {engine.currentPhase.charAt(0).toUpperCase() + engine.currentPhase.slice(1)}
              </GlowText>
            </div>
          </GlassmorphismCard>
        </StaggerItem>

        <StaggerItem>
          <GlassmorphismCard glowColor="#f59e0b" intensity="low">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Streak</span>
              </div>
              <AnimatedCounter value={engine.globalStreak} suffix="d" className="text-sm font-bold text-amber-400" />
            </div>
          </GlassmorphismCard>
        </StaggerItem>

        <StaggerItem>
          <GlassmorphismCard glowColor="#10b981" intensity="low">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Best</span>
              </div>
              <AnimatedCounter value={engine.globalLongestStreak} suffix="d" className="text-sm font-bold text-emerald-400" />
            </div>
          </GlassmorphismCard>
        </StaggerItem>

        <StaggerItem>
          <GlassmorphismCard glowColor="#8b5cf6" intensity="low">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Crown className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Mastered</span>
              </div>
              <AnimatedCounter value={masteredHabits.length} className="text-sm font-bold text-violet-400" />
            </div>
          </GlassmorphismCard>
        </StaggerItem>
      </StaggerList>

      {/* Seinfeld Chain — 30-day animated visual */}
      <GlassmorphismCard glowColor="#10b981" intensity="medium">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-amber-500/60" />
              Don&apos;t Break the Chain
            </h4>
            <span className="text-[10px] text-zinc-600">Last 30 days</span>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
            {chainDays.map((day, i) => (
              <motion.div
                key={day.date}
                className="flex flex-col items-center gap-0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01, duration: 0.2 }}
              >
                <motion.div
                  className="w-full aspect-square rounded-sm relative overflow-hidden"
                  style={{
                    backgroundColor: day.completed ? "#10b98180" : day.isToday ? "#f59e0b30" : "#27272a40",
                    border: day.isToday ? "1px solid #f59e0b60" : "none",
                  }}
                  whileHover={{ scale: 1.3, zIndex: 10 }}
                  title={`${day.date}: ${day.count} habits done`}
                >
                  {day.completed && (
                    <motion.div
                      className="absolute inset-0 rounded-sm"
                      style={{ background: "linear-gradient(135deg, transparent, rgba(255,255,255,0.1))" }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.05 }}
                    />
                  )}
                </motion.div>
                <span className={`text-[7px] ${day.isToday ? "text-amber-400 font-bold" : "text-zinc-600"}`}>
                  {day.dayLabel}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassmorphismCard>

      {/* Progress ring + completion bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GlassmorphismCard glowColor="#10b981" intensity="low">
          <div className="p-4 flex items-center gap-4">
            <AnimatedProgressRing
              value={completionPct}
              size={64}
              color="#10b981"
              label="Sunnahs"
            />
            <div>
              <p className="text-sm font-bold text-zinc-200">
                <AnimatedCounter value={totalActiveMastered} /> / {totalSunnahs}
              </p>
              <p className="text-[10px] text-zinc-500">Sunnahs adopted</p>
            </div>
          </div>
        </GlassmorphismCard>

        <GlassmorphismCard glowColor="#f59e0b" intensity="low">
          <div className="p-4 flex items-center gap-4">
            <AnimatedProgressRing
              value={Math.min(100, (engine.globalStreak / 30) * 100)}
              size={64}
              color="#f59e0b"
              label="30-day"
            />
            <div>
              <p className="text-sm font-bold text-zinc-200">
                <AnimatedCounter value={engine.globalStreak} suffix=" / 30" />
              </p>
              <p className="text-[10px] text-zinc-500">Day streak goal</p>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    </div>
  );
}

/**
 * AnimatedStatsGrid — Premium animated stats cards for the bottom of dashboard
 */
export function AnimatedStatsGrid() {
  const engine = useHabitEngine();
  const stats = [
    { label: "Active", value: Object.values(engine.habits).filter(h => h.status === "active").length, icon: Flame, color: "#f59e0b" },
    { label: "Mastered", value: Object.values(engine.habits).filter(h => h.status === "mastered").length, icon: Crown, color: "#10b981" },
    { label: "Day Streak", value: engine.globalStreak, icon: Zap, color: "#f59e0b" },
    { label: "Total Days", value: Object.values(engine.habits).reduce((sum, h) => sum + h.totalDays, 0), icon: CheckCircle2, color: "#10b981" },
  ];

  return (
    <StaggerList className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <StaggerItem key={stat.label}>
          <GlassmorphismCard glowColor={stat.color} intensity="low" hover>
            <div className="text-center py-3 px-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <stat.icon className={`w-4 h-4 mx-auto mb-1.5 opacity-60`} style={{ color: stat.color }} />
              </motion.div>
              <AnimatedCounter value={stat.value} className="text-lg font-bold text-zinc-200" />
              <p className="text-[10px] text-zinc-600">{stat.label}</p>
            </div>
          </GlassmorphismCard>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}

/**
 * AnimatedHabitCard — Premium animated version of HabitSunnahCard
 * Wraps the existing card with entrance animations and micro-interactions
 */
export function AnimatedHabitCard({ children, sunnahId }: { children: React.ReactNode; sunnahId: string }) {
  const tracker = useSunnahTracker();
  const isCompleted = tracker.isCompleted(sunnahId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className={`relative ${isCompleted ? "ring-1 ring-emerald-500/30" : ""}`}>
        {isCompleted && (
          <motion.div
            className="absolute -top-1 -right-1 z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
