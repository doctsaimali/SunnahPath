import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages / static hosting
  // Auth callback is fully client-side (PKCE flow), so static works with Supabase
  output: "export" as const,
  // Only set basePath for GitHub Pages production builds
  ...(isGitHubPages ? { basePath: "/sunnah-path" } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    ".space-z.ai",
  ],
};

export default nextConfig;
