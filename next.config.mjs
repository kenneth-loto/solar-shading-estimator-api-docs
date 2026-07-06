import { withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import "./env/server.ts";
import "./env/client.ts";

const withMDX = createMDX();

const isDev = process.env.NODE_ENV === "development";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryOrigin = sentryDsn ? new URL(sentryDsn).origin : "";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

if (sentryOrigin) {
  cspDirectives.push(`connect-src 'self' ${sentryOrigin}`);
}

const cspHeader = cspDirectives.join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    sri: {
      algorithm: "sha256",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withMDX(nextConfig), {
  org: "kenzu-org",
  project: "solar-shading-estimator-api-docs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
