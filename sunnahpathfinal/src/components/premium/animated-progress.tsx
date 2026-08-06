"use client";

import { motion } from "framer-motion";

/**
 * AnimatedProgressRing — Circular progress indicator with animated fill
 * Perfect for streaks, completion rates, and habit progress
 */
interface AnimatedProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  label?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export function AnimatedProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = "#10b981",
  bgColor = "#27272a",
  className = "",
  label,
  showPercentage = true,
  children,
}: AnimatedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with animation */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clampedValue / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
        {/* Glow effect on progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          opacity={0.15}
          filter="blur(4px)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clampedValue / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showPercentage && (
              <motion.span
                className="text-sm font-bold text-zinc-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {Math.round(clampedValue)}%
              </motion.span>
            )}
            {label && (
              <span className="text-[9px] text-zinc-500 mt-0.5">{label}</span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/**
 * AnimatedProgressBar — Horizontal bar with gradient fill and shimmer effect
 */
interface AnimatedProgressBarProps {
  value: number; // 0-100
  height?: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function AnimatedProgressBar({
  value,
  height = 8,
  color = "#10b981",
  showLabel = true,
  className = "",
  animate = true,
}: AnimatedProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-zinc-500">Progress</span>
          <motion.span
            className="text-[10px] font-bold text-zinc-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(clampedValue)}%
          </motion.span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: "#27272a" }}
      >
        <motion.div
          className="relative h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
          initial={{ width: animate ? "0%" : `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
