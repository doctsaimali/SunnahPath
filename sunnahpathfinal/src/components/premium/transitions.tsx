"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { ReactNode } from "react";

/**
 * PageTransition — Smooth animated transitions between views/tabs
 * Wraps content with enter/exit animations
 */

// Shared transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -10, filter: "blur(2px)", transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 15, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
};

interface PageTransitionProps {
  children: ReactNode;
  viewKey: string;
  className?: string;
}

export function PageTransition({ children, viewKey, className = "" }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * StaggerList — Staggered animation for lists of items
 */
interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList({ children, className = "", staggerDelay = 0.06 }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      variants={{ animate: { transition: { staggerChildren: staggerDelay, delayChildren: 0.05 } } }}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — Individual item within a StaggerList
 */
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedTab — Tab button with animated active indicator
 */
interface AnimatedTabProps {
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  activeColor?: string;
}

export function AnimatedTab({ isActive, onClick, icon, label, activeColor = "#f59e0b" }: AnimatedTabProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        backgroundColor: isActive ? `${activeColor}cc` : "rgba(24,24,27,0.4)",
        color: isActive ? "#ffffff" : "#71717a",
        boxShadow: isActive ? `0 0 15px ${activeColor}30` : "none",
        border: isActive ? "none" : "1px solid rgba(39,39,42,0.4)",
      }}
      transition={{ duration: 0.15 }}
    >
      {icon}
      {label}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
          style={{ backgroundColor: activeColor, width: "60%" }}
          layoutId="tab-indicator"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}

/**
 * PulseIndicator — Pulsing dot for active/live states
 */
interface PulseIndicatorProps {
  color?: string;
  size?: number;
  className?: string;
}

export function PulseIndicator({ color = "#10b981", size = 8, className = "" }: PulseIndicatorProps) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full"
        style={{ backgroundColor: color }}
        animate={{ opacity: [0.7, 0, 0.7], scale: [1, 2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ backgroundColor: color, width: size, height: size }}
      />
    </span>
  );
}

/**
 * AnimatedToggle — Toggle switch with spring animation
 */
interface AnimatedToggleProps {
  isOn: boolean;
  onToggle: () => void;
  color?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function AnimatedToggle({ isOn, onToggle, color = "#10b981", size = "sm", disabled = false }: AnimatedToggleProps) {
  const sizeMap = { sm: { width: 36, height: 20, dot: 14 }, md: { width: 44, height: 24, dot: 18 } };
  const s = sizeMap[size];

  return (
    <motion.button
      className="relative rounded-full"
      style={{
        width: s.width,
        height: s.height,
        backgroundColor: isOn ? color : "#27272a",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={() => !disabled && onToggle()}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="absolute top-1 rounded-full bg-white"
        style={{ width: s.dot, height: s.dot }}
        animate={{ left: isOn ? s.width - s.dot - 3 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      {isOn && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.2 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

/**
 * Breathe — Subtle breathing/pulsing animation for ambient effects
 */
interface BreatheProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function Breathe({ children, className = "", intensity = 0.05 }: BreatheProps) {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1 + intensity, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * RippleButton — Button with ripple effect on click
 */
interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  rippleColor?: string;
  disabled?: boolean;
}

export function RippleButton({ children, onClick, className = "", rippleColor = "rgba(255,255,255,0.2)", disabled = false }: RippleButtonProps) {
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.15 }}
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{ backgroundColor: rippleColor }}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
}
