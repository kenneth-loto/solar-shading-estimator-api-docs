import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Solar Shading Estimator API",
    template: "%s — Solar Shading Estimator API",
  },
  description:
    "Estimate realistic solar energy production by combining NASA POWER irradiance data, PVWatts baseline estimates, and a simplified sun-position vs. obstruction shading model.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.className} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
