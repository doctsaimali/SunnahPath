"use client";

import React, { Component } from "react";
import { motion } from "framer-motion";

/**
 * ErrorBoundary — Catches React render errors gracefully
 * Shows a beautiful error UI instead of a blank screen
 */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[SunnahPath ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">⚠️</span>
            </motion.div>

            <div>
              <h2 className="text-xl font-bold text-zinc-100 mb-2">Something went wrong</h2>
              <p className="text-sm text-zinc-400">
                An unexpected error occurred. Your data is safe — this is just a display issue.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/30 text-left">
                <p className="text-xs text-zinc-500 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors"
              >
                Reload App
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
