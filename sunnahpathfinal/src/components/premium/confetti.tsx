"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ConfettiCelebration — Canvas-based confetti for milestone celebrations
 * Lightweight, GPU-accelerated, no external deps
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "circle" | "star" | "rect";
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
  colors?: string[];
  particleCount?: number;
  duration?: number;
}

const DEFAULT_COLORS = [
  "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9",
  "#ef4444", "#f97316", "#ec4899", "#14b8a6",
];

function createParticle(canvasWidth: number, canvasHeight: number, colors: string[]): Particle {
  const shape = (["circle", "star", "rect"] as const)[Math.floor(Math.random() * 3)];
  return {
    x: canvasWidth / 2 + (Math.random() - 0.5) * 100,
    y: canvasHeight * 0.5,
    vx: (Math.random() - 0.5) * 15,
    vy: -Math.random() * 18 - 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
    shape,
  };
}

export function ConfettiCelebration({
  isActive,
  onComplete,
  colors = DEFAULT_COLORS,
  particleCount = 80,
  duration = 3000,
}: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = [];
      onComplete?.();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.vx *= 0.99; // air resistance
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // Star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = p.size / 2;
          if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
          else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [duration, onComplete]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height, colors)
    );

    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, animate, particleCount, colors]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.canvas
          ref={canvasRef}
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * MilestonePopup — Premium celebration popup with glow + confetti
 */
interface MilestonePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

export function MilestonePopup({
  isOpen,
  onClose,
  title,
  description,
  icon,
  color = "#f59e0b",
}: MilestonePopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Popup */}
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-sm w-full p-8 rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #18181b 0%, #1f1f23 100%)",
                border: `1px solid ${color}40`,
                boxShadow: `0 0 60px ${color}20, 0 0 120px ${color}10`,
              }}
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: `2px solid ${color}30` }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="relative text-center space-y-4">
                {/* Icon with pulse */}
                <motion.div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {icon || (
                    <motion.span
                      className="text-3xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      🏆
                    </motion.span>
                  )}
                </motion.div>

                <motion.h3
                  className="text-xl font-bold text-zinc-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h3>

                <motion.p
                  className="text-sm text-zinc-400 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {description}
                </motion.p>

                <motion.button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    boxShadow: `0 0 20px ${color}30`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Alhamdulillah! 🌟
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
