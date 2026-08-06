"use client";

import React, { useState, useEffect } from "react";

/**
 * HydrationSafe — Prevents SSR/client mismatch with localStorage-persisted Zustand stores.
 * 
 * Problem: Server renders with default empty state, but client has saved data in localStorage.
 * This causes React hydration mismatch errors and flickering.
 * 
 * Solution: Render a loading skeleton on first paint, then after mount (when localStorage
 * is available), render the real content. This way server HTML matches the initial client render.
 */
export function HydrationSafe({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-xs text-zinc-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
