import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export" as const,
  ...(isGitHubPages ? { basePath: "/SunnahPath" } : {}),
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
