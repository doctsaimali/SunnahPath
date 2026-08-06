"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
  getSession,
} from "@/lib/supabase/client";
import { Mail, Lock, User, ArrowRight, Loader2, Chrome, Sparkles } from "lucide-react";

/**
 * AuthModal — Beautiful animated authentication modal
 * Falls back gracefully when Supabase isn't configured
 */

type AuthMode = "login" | "signup" | "magic-link";
type AuthState = "idle" | "loading" | "success" | "error";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isSupabaseConfigured) {
    return (
      <AnimatePresence>
        {isOpen && (
          <AuthBackdrop onClose={onClose}>
            <motion.div
              className="max-w-sm w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800/40 space-y-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-zinc-100">Cloud Sync Coming Soon</h3>
                <p className="text-xs text-zinc-400 mt-2">
                  Supabase is not configured yet. Your data is safely stored locally.
                  Add your Supabase credentials to enable cloud sync, multi-device, and auth.
                </p>
              </div>
              <button onClick={onClose} className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">
                Got it
              </button>
            </motion.div>
          </AuthBackdrop>
        )}
      </AnimatePresence>
    );
  }

  const handleEmailAuth = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
      }
      setStatus("success");
      onAuthSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg((err as Error)?.message || "Authentication failed");
    }
  };

  const handleMagicLink = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) throw error;
      setStatus("success");
      setErrorMsg("Check your email for the magic link!");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg((err as Error)?.message || "Failed to send magic link");
    }
  };

  const handleGoogleAuth = async () => {
    setStatus("loading");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg((err as Error)?.message || "Google sign-in failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <AuthBackdrop onClose={onClose}>
          <motion.div
            className="max-w-sm w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800/40 space-y-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="text-center">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">🕌</span>
              </motion.div>
              <h3 className="text-lg font-bold text-zinc-100">
                {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Magic Link"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {mode === "login" ? "Sign in to sync your Sunnahs across devices" : "Start your journey with cloud sync"}
              </p>
            </div>

            {/* Google OAuth */}
            <motion.button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-800/40 text-sm text-zinc-200 hover:bg-zinc-800/60 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] text-zinc-600">or</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Email/Password form */}
            {mode !== "magic-link" && (
              <div className="space-y-2.5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <motion.button
                  onClick={handleEmailAuth}
                  disabled={!email || !password || status === "loading"}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </motion.button>
              </div>
            )}

            {/* Magic Link */}
            {mode === "magic-link" && (
              <div className="space-y-2.5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email for magic link"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <motion.button
                  onClick={handleMagicLink}
                  disabled={!email || status === "loading"}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Send Magic Link
                </motion.button>
              </div>
            )}

            {/* Error/Success message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.p
                  className="text-xs text-center"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ color: status === "success" ? "#10b981" : "#ef4444" }}
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Mode switcher */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("signup")} className="hover:text-zinc-300 transition-colors">Create account</button>
                  <span>·</span>
                  <button onClick={() => setMode("magic-link")} className="hover:text-zinc-300 transition-colors">Magic link</button>
                </>
              )}
              {mode === "signup" && (
                <>
                  <button onClick={() => setMode("login")} className="hover:text-zinc-300 transition-colors">Sign in</button>
                  <span>·</span>
                  <button onClick={() => setMode("magic-link")} className="hover:text-zinc-300 transition-colors">Magic link</button>
                </>
              )}
              {mode === "magic-link" && (
                <>
                  <button onClick={() => setMode("login")} className="hover:text-zinc-300 transition-colors">Sign in</button>
                  <span>·</span>
                  <button onClick={() => setMode("signup")} className="hover:text-zinc-300 transition-colors">Create account</button>
                </>
              )}
            </div>
          </motion.div>
        </AuthBackdrop>
      )}
    </AnimatePresence>
  );
}

function AuthBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
