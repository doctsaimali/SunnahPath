"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  categories,
  sunnahs,
} from "@/data/sunnahs";
import { useHabitEngine } from "@/lib/habit-engine";
import { useSettings } from "@/lib/settings-store";
import { useAccountability } from "@/lib/accountability-store";
import { useSunnahTracker } from "@/lib/store";
import { HydrationSafe } from "@/components/hydration-safe";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  HabitOnboarding,
  StreakDashboard,
  HabitSunnahCard,
  EveningReflection,
  WeeklyReviewPanel,
  CommitmentContractPanel,
  SettingsPanel,
  MilestoneCelebration,
  ActivateNextHabitButton,
  GradingLegend,
} from "@/components/habit-components";
import {
  // Premium animated components
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedTab,
  AnimatedCounter,
  AnimatedStreakDashboard,
  AnimatedStatsGrid,
  AnimatedHabitCard,
  ConfettiCelebration,
  MilestonePopup,
  GlassmorphismCard,
  GlowText,
  ShimmerLoading,
  PulseIndicator,
  Breathe,
  AuthModal,
} from "@/components/premium";
import { ErrorBoundary } from "@/components/error-boundary";
import { isSupabaseConfigured, getCurrentUser, signOut as supabaseSignOut } from "@/lib/supabase/client";
import {
  Droplets, Moon, Sun, Sunset, Bed, UtensilsCrossed, Shirt, Users,
  Home, Heart, Calendar, DoorOpen, Star, CheckCircle2, ChevronDown,
  BookOpen, Search, X, Filter, Settings2, Moon as MoonIcon, Brain,
  Flame, Target, Handshake, ScrollText, Compass, Crown, Zap,
  LayoutDashboard, BookHeart, ClipboardCheck, Sparkles,
  Download, Upload, HardDrive, AlertCircle, CheckCheck,
  LogIn, LogOut, Cloud, CloudOff, Bell, Wifi, WifiOff,
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
  anytime: { label: "Any Time", icon: Compass },
};

type ViewTab = "dashboard" | "sunnahs" | "reflect" | "settings";

// ─── Online Status Hook ────────────────────────────────────────────────
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return isOnline;
}

// ─── Notification Permission ───────────────────────────────────────────
function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);
  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      setPermission(p);
    }
  }, []);
  return { permission, requestPermission };
}

// ─── Data Backup / Restore (Premium Animated) ──────────────────────────

function DataBackupRestore() {
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        stores: {
          "sunnah-habit-engine": JSON.parse(localStorage.getItem("sunnah-habit-engine") || "{}"),
          "sunnah-settings": JSON.parse(localStorage.getItem("sunnah-settings") || "{}"),
          "sunnah-accountability": JSON.parse(localStorage.getItem("sunnah-accountability") || "{}"),
          "sunnah-tracker-storage": JSON.parse(localStorage.getItem("sunnah-tracker-storage") || "{}"),
        },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sunnahpath-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Downloaded!");
      setTimeout(() => setExportStatus(null), 3000);
    } catch {
      setExportStatus("Export failed");
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.version !== 1 || !data.stores) {
            setImportStatus("Invalid backup file");
            setTimeout(() => setImportStatus(null), 3000);
            return;
          }
          for (const [key, value] of Object.entries(data.stores)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          setImportStatus("Restored! Reloading...");
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          setImportStatus("Invalid file format");
          setTimeout(() => setImportStatus(null), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <GlassmorphismCard glowColor="#0ea5e9" intensity="low">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data Backup & Restore</h4>
        </div>
        <p className="text-[10px] text-zinc-600">
          All your progress, habits, streaks, settings, and reflections are saved in your browser&apos;s localStorage. 
          They persist across sessions automatically. Use backup to save a copy or transfer to another device.
        </p>
        <div className="flex gap-2">
          <motion.button
            onClick={handleExport}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-400 flex items-center justify-center gap-1.5"
            whileHover={{ scale: 1.02, backgroundColor: "rgba(5,150,105,0.25)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-3 h-3" />
            {exportStatus || "Export Backup"}
          </motion.button>
          <motion.button
            onClick={handleImport}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 flex items-center justify-center gap-1.5"
            whileHover={{ scale: 1.02, backgroundColor: "rgba(37,99,235,0.25)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-3 h-3" />
            {importStatus || "Import Backup"}
          </motion.button>
        </div>
      </div>
    </GlassmorphismCard>
  );
}

// ─── Storage Info Display ──────────────────────────────────────────────

function StorageInfo() {
  const [info, setInfo] = useState<{ keys: string[]; totalSize: string } | null>(null);

  useMemo(() => {
    if (typeof window === "undefined") return;
    const storeKeys = ["sunnah-habit-engine", "sunnah-settings", "sunnah-accountability", "sunnah-tracker-storage"];
    let totalBytes = 0;
    for (const key of storeKeys) {
      const val = localStorage.getItem(key);
      if (val) totalBytes += val.length * 2;
    }
    const totalSize = totalBytes < 1024 ? `${totalBytes} B` : `${(totalBytes / 1024).toFixed(1)} KB`;
    setInfo({ keys: storeKeys.filter(k => localStorage.getItem(k) !== null), totalSize });
  }, []);

  if (!info) return null;

  return (
    <div className="p-3 rounded-lg bg-zinc-800/20 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Storage used</span>
        <span className="text-[10px] text-zinc-400 font-mono">{info.totalSize}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Stores saved</span>
        <span className="text-[10px] text-zinc-400">{info.keys.length}/4</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {info.keys.map(k => (
          <span key={k} className="text-[8px] text-zinc-500 bg-zinc-800/40 px-1.5 py-0.5 rounded font-mono">{k.replace("sunnah-", "")}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Connection Status Banner ──────────────────────────────────────────

function ConnectionBanner({ isOnline }: { isOnline: boolean }) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 bg-amber-600/90 text-white text-xs font-medium backdrop-blur-sm"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          <WifiOff className="w-3 h-3" />
          You&apos;re offline — changes will sync when reconnected
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page Content (rendered after hydration) ─────────────────────

function SunnahPathContent() {
  const [activeView, setActiveView] = useState<ViewTab>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [milestonePopup, setMilestonePopup] = useState<{ isOpen: boolean; title: string; description: string; color: string }>({
    isOpen: false, title: "", description: "", color: "#f59e0b",
  });
  const [isAuthed, setIsAuthed] = useState(false);
  const [usePremiumAnimations, setUsePremiumAnimations] = useState(true);
  
  const engine = useHabitEngine();
  const settings = useSettings();
  const tracker = useSunnahTracker();
  const isOnline = useOnlineStatus();
  const { permission: notifPermission, requestPermission: requestNotif } = useNotificationPermission();

  // Scroll-based parallax for header
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.3]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.95]);

  // Check auth state
  useEffect(() => {
    if (isSupabaseConfigured) {
      getCurrentUser().then(user => setIsAuthed(!!user));
    }
  }, []);

  // Handle milestone celebrations
  useEffect(() => {
    const uncelebrated = engine.milestones.find(m => !m.celebrated);
    if (uncelebrated && settings.celebrateAnimations) {
      setMilestonePopup({
        isOpen: true,
        title: uncelebrated.title,
        description: uncelebrated.description,
        color: "#f59e0b",
      });
      setCelebrationActive(true);
      setTimeout(() => setCelebrationActive(false), 3000);
    }
  }, [engine.milestones, settings.celebrateAnimations]);

  const showOnboarding = !engine.onboardingComplete && engine.onboardingStep < 4;

  const filteredSunnahs = useMemo(() => {
    let result = sunnahs;
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    if (selectedTime) result = result.filter(s => s.timeOfDay === selectedTime || s.timeOfDay === "anytime");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.hadithText.toLowerCase().includes(q) ||
        s.references.some(r => r.book.toLowerCase().includes(q))
      );
    }
    const habitOrder = (s: typeof sunnahs[0]) => {
      const h = engine.habits[s.id];
      if (!h) return 2;
      if (h.status === "active") return 0;
      if (h.status === "mastered") return 0.5;
      if (h.status === "paused") return 1;
      return 2;
    };
    result = [...result].sort((a, b) => habitOrder(a) - habitOrder(b));
    
    if (settings.hiddenCategories.length > 0) {
      result = result.filter(s => !settings.hiddenCategories.includes(s.category));
    }
    
    return result;
  }, [selectedCategory, selectedTime, searchQuery, engine.habits, settings.hiddenCategories]);

  const completedCount = sunnahs.filter(s => tracker.isCompleted(s.id)).length;

  // ─── ONBOARDING VIEW ────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <ConfettiCelebration isActive={celebrationActive} onComplete={() => setCelebrationActive(false)} />
        <motion.div
          className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/40 to-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <motion.header
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Breathe>
              <p className="text-sm text-amber-500/70 mb-3 font-medium" dir="rtl">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
            </Breathe>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              <GlowText color="#10b981" className="text-emerald-400">Sunnah</GlowText>
              <GlowText color="#f59e0b" className="text-amber-400">Path</GlowText>
            </h1>
            <motion.p
              className="text-sm text-zinc-500 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Build daily Sunnah habits — one at a time, with psychology-backed methods
            </motion.p>
          </motion.header>
          <HabitOnboarding />
        </div>
      </div>
    );
  }

  // ─── MAIN APP VIEW ──────────────────────────────────────────────────
  const viewTabs: { key: ViewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" />, color: "#f59e0b" },
    { key: "sunnahs", label: "Sunnahs", icon: <BookHeart className="w-3.5 h-3.5" />, color: "#10b981" },
    { key: "reflect", label: "Reflect", icon: <ClipboardCheck className="w-3.5 h-3.5" />, color: "#8b5cf6" },
    { key: "settings", label: "Settings", icon: <Settings2 className="w-3.5 h-3.5" />, color: "#71717a" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Celebration effects */}
      <ConfettiCelebration isActive={celebrationActive} onComplete={() => setCelebrationActive(false)} />
      <MilestonePopup
        isOpen={milestonePopup.isOpen}
        onClose={() => setMilestonePopup(prev => ({ ...prev, isOpen: false }))}
        title={milestonePopup.title}
        description={milestonePopup.description}
        color={milestonePopup.color}
      />

      {/* Connection status */}
      <ConnectionBanner isOnline={isOnline} />

      {/* Animated top border */}
      <motion.div
        className="h-px w-full bg-gradient-to-r from-transparent via-amber-600/40 to-transparent"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ── Header with parallax ── */}
        <motion.header
          className="pt-8 pb-6 text-center"
          style={{ opacity: headerOpacity, scale: headerScale }}
        >
          <Breathe intensity={0.03}>
            <p className="text-sm text-amber-500/70 mb-2 font-medium" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
          </Breathe>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            <GlowText color="#10b981" className="text-emerald-400">Sunnah</GlowText>
            <GlowText color="#f59e0b" className="text-amber-400">Path</GlowText>
          </h1>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Build daily Sunnahs one at a time — psychology-backed habit formation
          </p>

          {/* Auth + Cloud status */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {isSupabaseConfigured && (
              <motion.button
                onClick={() => isAuthed ? supabaseSignOut().then(() => setIsAuthed(false)) : setShowAuthModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAuthed ? (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Synced</span>
                    <LogOut className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3" />
                    Sign in to sync
                    <LogIn className="w-3 h-3 ml-1" />
                  </>
                )}
              </motion.button>
            )}
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-zinc-600 bg-zinc-900/40 border border-zinc-800/40">
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-500/60" /> : <WifiOff className="w-3 h-3 text-red-400/60" />}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </motion.header>

        {/* ── Animated View Tabs ── */}
        <motion.div
          className="flex gap-1 mb-6 overflow-x-auto pb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {viewTabs.map((tab) => (
            <AnimatedTab
              key={tab.key}
              isActive={activeView === tab.key}
              onClick={() => setActiveView(tab.key)}
              icon={tab.icon}
              label={tab.label}
              activeColor={tab.color}
            />
          ))}
        </motion.div>

        {/* ══════════════════ DASHBOARD VIEW ══════════════════ */}
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <PageTransition viewKey="dashboard">
              <div className="space-y-6 pb-10">
                {/* Premium animated dashboard */}
                <AnimatedStreakDashboard />
                <Separator className="bg-zinc-800/40" />

                <div className="space-y-3">
                  <motion.h3
                    className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Target className="w-3 h-3 text-amber-500/60" />
                    Today&apos;s Active Habits
                    <PulseIndicator color="#f59e0b" size={5} className="ml-1" />
                  </motion.h3>
                  <StaggerList className="space-y-3">
                    {Object.values(engine.habits)
                      .filter(h => h.status === "active")
                      .map((habit) => {
                        const sunnah = sunnahs.find(s => s.id === habit.sunnahId);
                        if (!sunnah) return null;
                        return (
                          <StaggerItem key={sunnah.id}>
                            <AnimatedHabitCard sunnahId={sunnah.id}>
                              <HabitSunnahCard sunnah={sunnah} />
                            </AnimatedHabitCard>
                          </StaggerItem>
                        );
                      })}
                  </StaggerList>
                  {Object.values(engine.habits).filter(h => h.status === "active").length === 0 && (
                    <GlassmorphismCard glowColor="#f59e0b" intensity="low">
                      <div className="p-6 text-center">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Target className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                        </motion.div>
                        <p className="text-xs text-zinc-500">No active habits yet. Add your first one below!</p>
                      </div>
                    </GlassmorphismCard>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <ActivateNextHabitButton />
                </motion.div>

                {Object.values(engine.habits).filter(h => h.status === "mastered").length > 0 && (
                  <>
                    <Separator className="bg-zinc-800/40" />
                    <div className="space-y-3">
                      <motion.h3
                        className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Crown className="w-3 h-3 text-emerald-500/60" />
                        Mastered Habits
                      </motion.h3>
                      <StaggerList className="space-y-3">
                        {Object.values(engine.habits)
                          .filter(h => h.status === "mastered")
                          .map((habit) => {
                            const sunnah = sunnahs.find(s => s.id === habit.sunnahId);
                            if (!sunnah) return null;
                            return (
                              <StaggerItem key={sunnah.id}>
                                <AnimatedHabitCard sunnahId={sunnah.id}>
                                  <HabitSunnahCard sunnah={sunnah} />
                                </AnimatedHabitCard>
                              </StaggerItem>
                            );
                          })}
                      </StaggerList>
                    </div>
                  </>
                )}

                <Separator className="bg-zinc-800/40" />
                <AnimatedStatsGrid />
              </div>
            </PageTransition>
          )}

          {/* ══════════════════ SUNNAHS VIEW ══════════════════ */}
          {activeView === "sunnahs" && (
            <PageTransition viewKey="sunnahs">
              <div className="space-y-4 pb-10">
                {/* Animated search bar */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Search Sunnahs, hadith, references..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <X className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Category filters with animation */}
                <motion.div
                  className="flex flex-wrap gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {categories
                    .filter(c => !settings.hiddenCategories.includes(c.id))
                    .map((cat, i) => {
                      const IconComp = iconMap[cat.icon] || Star;
                      const isActive = selectedCategory === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            isActive
                              ? "text-white shadow-sm"
                              : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/60"
                          }`}
                          style={isActive ? { backgroundColor: cat.color + "cc" } : undefined}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComp className="w-3 h-3" />
                          {cat.name}
                        </motion.button>
                      );
                    })}
                </motion.div>

                {/* Time filters */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(timeLabels).map(([key, info]) => {
                    const TimeIconComp = info.icon;
                    const isActive = selectedTime === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => setSelectedTime(isActive ? null : key)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isActive
                            ? "bg-amber-600/80 text-white shadow-sm"
                            : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/60"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <TimeIconComp className="w-3 h-3" />
                        {info.label}
                      </motion.button>
                    );
                  })}
                  {(selectedCategory || selectedTime) && (
                    <motion.button
                      onClick={() => { setSelectedCategory(null); setSelectedTime(null); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </motion.button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-600">
                    <AnimatedCounter value={filteredSunnahs.length} /> Sunnahs
                  </p>
                </div>

                {/* Animated sunnah list */}
                <StaggerList className="space-y-3">
                  {filteredSunnahs.map((sunnah) => (
                    <StaggerItem key={sunnah.id}>
                      <AnimatedHabitCard sunnahId={sunnah.id}>
                        <HabitSunnahCard sunnah={sunnah} />
                      </AnimatedHabitCard>
                    </StaggerItem>
                  ))}
                </StaggerList>

                {filteredSunnahs.length === 0 && (
                  <GlassmorphismCard glowColor="#71717a" intensity="low">
                    <div className="text-center py-16">
                      <Search className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                      <p className="text-sm text-zinc-600">No Sunnahs match your filters</p>
                      <motion.button
                        onClick={() => { setSelectedCategory(null); setSelectedTime(null); setSearchQuery(""); }}
                        className="mt-2 text-xs text-amber-500 hover:text-amber-400"
                        whileHover={{ scale: 1.05 }}
                      >
                        Clear all filters
                      </motion.button>
                    </div>
                  </GlassmorphismCard>
                )}

                <Separator className="bg-zinc-800/40" />
                <div className="text-center">
                  <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Hadith Grading</h3>
                  <GradingLegend />
                </div>
              </div>
            </PageTransition>
          )}

          {/* ══════════════════ REFLECT VIEW ══════════════════ */}
          {activeView === "reflect" && (
            <PageTransition viewKey="reflect">
              <div className="space-y-6 pb-10">
                <GlassmorphismCard glowColor="#8b5cf6" intensity="medium">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <h3 className="text-sm font-bold text-zinc-200">Habit Building Psychology</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This accountability system is based on three proven principles:
                      <strong className="text-zinc-300"> Implementation Intentions</strong> (Gollwitzer) — specific &ldquo;if-then&rdquo; plans are 2-3x more effective;
                      <strong className="text-zinc-300"> Never Miss Twice</strong> (Clear) — one miss is an accident, two is the start of a new (bad) habit;
                      <strong className="text-zinc-300"> Identity-Based Habits</strong> (Clear) — focus on becoming the type of person who practices Sunnahs, not just doing them.
                    </p>
                  </div>
                </GlassmorphismCard>

                <EveningReflection />

                {settings.showCommitmentContract && <CommitmentContractPanel />}

                <Separator className="bg-zinc-800/40" />

                {settings.weeklyReviewEnabled && <WeeklyReviewPanel />}
              </div>
            </PageTransition>
          )}

          {/* ══════════════════ SETTINGS VIEW ══════════════════ */}
          {activeView === "settings" && (
            <PageTransition viewKey="settings">
              <div className="space-y-6 pb-10">
                <SettingsPanel />

                <Separator className="bg-zinc-800/40" />

                {/* Notification Permission */}
                <GlassmorphismCard glowColor="#f59e0b" intensity="low">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notifications</h4>
                    </div>
                    <p className="text-[10px] text-zinc-600">Enable push notifications for daily Sunnah reminders and streak alerts.</p>
                    {notifPermission !== "granted" ? (
                      <motion.button
                        onClick={requestNotif}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-600/20 text-amber-400 flex items-center gap-1.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Bell className="w-3 h-3" />
                        Enable Notifications
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Notifications enabled
                      </div>
                    )}
                  </div>
                </GlassmorphismCard>

                {/* Cloud Sync Section */}
                <GlassmorphismCard glowColor="#0ea5e9" intensity="low">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cloud Sync</h4>
                    </div>
                    {isSupabaseConfigured ? (
                      <div className="space-y-2">
                        {isAuthed ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Signed in — data syncs across devices
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => setShowAuthModal(true)}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 flex items-center gap-1.5"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <LogIn className="w-3 h-3" />
                            Sign in for cloud sync
                          </motion.button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-600">
                        Supabase not configured. Data is stored locally. Add your Supabase credentials to enable cloud sync, multi-device, and auth.
                      </p>
                    )}
                  </div>
                </GlassmorphismCard>

                {/* Data Backup & Restore */}
                <DataBackupRestore />
                <StorageInfo />

                <Separator className="bg-zinc-800/40" />

                {/* Danger Zone */}
                <motion.div
                  className="p-4 rounded-xl bg-red-950/20 border border-red-800/30 space-y-3"
                  whileHover={{ borderColor: "rgba(220,38,38,0.4)" }}
                >
                  <h4 className="text-xs font-bold text-red-400/80 uppercase tracking-widest">Danger Zone</h4>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => {
                        if (confirm("Are you sure? This will permanently delete all your progress, habits, streaks, and reflections.")) {
                          engine.resetEngine();
                          tracker.resetAll();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(220,38,38,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Reset All Progress
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-zinc-600">This will permanently delete all your habit data, streaks, and reflections from this browser.</p>
                </motion.div>
              </div>
            </PageTransition>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <motion.footer
          className="border-t border-zinc-800/40 pt-6 pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-sm"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🕌
              </motion.span>
              <span className="text-sm font-bold text-zinc-400">SunnahPath</span>
              <span className="text-[9px] text-zinc-700 ml-1">v0.2.1</span>
            </div>
            <p className="text-[11px] text-zinc-700 text-center max-w-md">
              Psychology-backed habit building: Tiny Habits (Fogg), Atomic Habits (Clear), Implementation Intentions (Gollwitzer), Seinfeld Chain Method.
            </p>
            <p className="text-xs text-zinc-700" dir="rtl">صلى الله عليه وسلم</p>
          </div>
        </motion.footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setIsAuthed(true)}
      />
    </div>
  );
}

// ─── Page Export (with ErrorBoundary + HydrationSafe) ─────────────────
export default function SunnahPathPage() {
  return (
    <ErrorBoundary>
      <HydrationSafe>
        <SunnahPathContent />
      </HydrationSafe>
    </ErrorBoundary>
  );
}
