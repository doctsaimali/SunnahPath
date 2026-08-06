"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

/**
 * AnimatedCounter — Smoothly animates a number from 0 → value
 * Uses spring physics for natural-feeling count-up
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatFn?: (v: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  className = "",
  prefix = "",
  suffix = "",
  formatFn,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current);
    return formatFn ? formatFn(rounded) : rounded.toString();
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span className={className} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}
