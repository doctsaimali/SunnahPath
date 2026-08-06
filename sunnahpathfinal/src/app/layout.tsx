import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SunnahPath — Authentic Daily Sunnahs with Complete Hadith",
  description: "Your comprehensive guide to the Sunnah of the Prophet Muhammad ﷺ. Every Sunnah includes complete hadith text with authentic references and hadith grading. Psychology-backed habit formation.",
  keywords: ["Sunnah", "Prophet Muhammad", "Hadith", "Islamic", "Muslim", "Daily Sunnah", "Sahih", "Hasan", "Adhkar", "Habit Tracker", "Islamic Habits"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕌</text></svg>",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SunnahPath",
  },
  openGraph: {
    title: "SunnahPath — Daily Sunnah Habit Builder",
    description: "Build daily Sunnah habits with psychology-backed methods. Authentic hadith references included.",
    type: "website",
    locale: "en_US",
    siteName: "SunnahPath",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
