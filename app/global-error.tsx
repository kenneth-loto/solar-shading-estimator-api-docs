"use client";

import * as Sentry from "@sentry/nextjs";
import { Geist, JetBrains_Mono } from "next/font/google";
import { useEffect } from "react";

const geistSans = Geist({
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
});

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --ge-bg: #fcfcfc;
            --ge-fg: #000000;
            --ge-muted-fg: #525252;
            --ge-tile-bg: #f5f5f5;
            --ge-btn-bg: #000000;
            --ge-btn-fg: #ffffff;
            --ge-btn-hover: #1d1d1d;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #000000;
              --ge-fg: #ffffff;
              --ge-muted-fg: #a4a4a4;
              --ge-tile-bg: #1d1d1d;
              --ge-btn-bg: #ffffff;
              --ge-btn-fg: #000000;
              --ge-btn-hover: #ebebeb;
            }
          }
          .ge-btn-transition {
            transition: background-color 0.15s ease-in-out;
          }
          .ge-btn-transition:hover {
            background-color: var(--ge-btn-hover) !important;
          }
        `}</style>
      </head>
      <body
        className={geistSans.className}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "0.5rem",
          padding: "1rem",
          backgroundColor: "var(--ge-bg)",
          color: "var(--ge-fg)",
          margin: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "2.5rem",
            height: "2.5rem",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0.5rem",
            backgroundColor: "var(--ge-tile-bg)",
            color: "var(--ge-fg)",
            marginBottom: "0.25rem",
          }}
        >
          {/* ShieldAlert icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: "0.875rem",
            lineHeight: "1.625",
            color: "var(--ge-muted-fg)",
            textAlign: "center",
            marginTop: "0.125rem",
          }}
        >
          The app could not be loaded. Try again <br /> in a moment.
        </p>

        {error.digest && (
          <p
            className={jetbrainsMono.className}
            style={{
              fontSize: "0.75rem",
              color: "var(--ge-muted-fg)",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={() => unstable_retry()}
          className="ge-btn-transition"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "2rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
            gap: "0.5rem",
            borderRadius: "0.4rem",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            backgroundColor: "var(--ge-btn-bg)",
            color: "var(--ge-btn-fg)",
            border: "1px solid transparent",
            marginTop: "0.5rem",
          }}
        >
          {/* RotateCcw icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Try again
        </button>
      </body>
    </html>
  );
}
