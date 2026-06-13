import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Cursor from "@/components/Cursor";
import PageSwitcher from "@/components/PageSwitcher";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DEATHCLOCK // CARBON INTELLIGENCE BUREAU",
  description:
    "Classified carbon budget intelligence system. Track your city's remaining carbon runway. CIB System Online.",
  keywords: ["carbon budget", "climate", "deathclock", "emissions"],
};

import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${ibmPlexSans.variable}`}>
      <body>
        <ErrorBoundary>
          {/* Scanline overlay */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
              pointerEvents: "none",
              zIndex: 9000,
            }}
          />
          {/* Vignette overlay */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
              pointerEvents: "none",
              zIndex: 9001,
            }}
          />

          {/* Custom cursor */}
          <Cursor />

          {/* Skip link */}
          <a href="#main-content" className="skip-link">Skip to main content</a>

          {/* Page switcher + nav dots */}
          <PageSwitcher />

          <main id="main-content">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
