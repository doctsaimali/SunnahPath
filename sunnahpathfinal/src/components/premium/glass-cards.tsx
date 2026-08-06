"use client";

import { motion, Variants } from "framer-motion";

/**
 * GlassmorphismCard — Frosted glass card with backdrop blur + gradient border
 * Premium card style for dashboard stats, habit cards, etc.
 */
interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
  hover?: boolean;
  onClick?: () => void;
}

const intensityMap = {
  low: { blur: 8, opacity: 0.03 },
  medium: { blur: 12, opacity: 0.06 },
  high: { blur: 20, opacity: 0.1 },
};

export function GlassmorphismCard({
  children,
  className = "",
  gradient = "from-emerald-500/10 via-transparent to-amber-500/10",
  glowColor = "#10b981",
  intensity = "medium",
  hover = true,
  onClick,
}: GlassmorphismCardProps) {
  const config = intensityMap[intensity];

  return (
    <motion.div
      className={`relative group overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-900/40 ${className}`}
      style={{
        backdropFilter: `blur(${config.blur}px)`,
        WebkitBackdropFilter: `blur(${config.blur}px)`,
      }}
      whileHover={hover ? {
        borderColor: `${glowColor}40`,
        boxShadow: `0 0 30px ${glowColor}15, 0 8px 32px rgba(0,0,0,0.3)`,
        y: -2,
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Animated border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${glowColor}20, transparent, ${glowColor}20, transparent)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/**
 * GradientBorder — Animated gradient border wrapper
 */
interface GradientBorderProps {
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
  className?: string;
  borderWidth?: number;
}

export function GradientBorder({
  children,
  colors = ["#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9"],
  speed = 4,
  className = "",
  borderWidth = 1,
}: GradientBorderProps) {
  const gradientStr = colors.join(", ");

  return (
    <div className={`relative rounded-xl ${className}`}>
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `conic-gradient(from 0deg, ${gradientStr})`,
          padding: borderWidth,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-xl bg-zinc-950" />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * GlowText — Text with animated glow effect
 */
interface GlowTextProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  animate?: boolean;
}

export function GlowText({
  children,
  color = "#10b981",
  className = "",
  animate = true,
}: GlowTextProps) {
  return (
    <motion.span
      className={`relative ${className}`}
      style={{ color }}
      animate={animate ? {
        textShadow: [
          `0 0 5px ${color}40`,
          `0 0 20px ${color}30`,
          `0 0 5px ${color}40`,
        ],
      } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}

/**
 * ShimmerLoading — Animated shimmer placeholder for loading states
 */
interface ShimmerLoadingProps {
  className?: string;
  rows?: number;
}

export function ShimmerLoading({ className = "", rows = 3 }: ShimmerLoadingProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <motion.div
            className="h-4 rounded-md bg-zinc-800/60"
            style={{ width: `${60 + Math.random() * 30}%` }}
            animate={{
              background: [
                "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)",
                "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)",
              ],
              backgroundPositionX: ["200%", "-200%"],
            }}
            transition={{
              backgroundPositionX: { duration: 1.5, repeat: Infinity, ease: "linear" },
            }}
          />
          <motion.div
            className="h-3 rounded-md bg-zinc-800/40"
            style={{ width: `${40 + Math.random() * 40}%` }}
            animate={{
              backgroundPositionX: ["200%", "-200%"],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
          />
        </div>
      ))}
    </div>
  );
}
