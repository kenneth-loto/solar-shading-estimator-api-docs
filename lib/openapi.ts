import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as Sentry from "@sentry/nextjs";
import { createOpenAPI } from "fumadocs-openapi/server";
import { serverEnv } from "@/env";
import { getErrorMessage } from "./errors";

const isProduction = serverEnv.NODE_ENV === "production";

const CACHE_DIR = ".cache";
const CACHE_FILE = join(CACHE_DIR, "openapi-spec.json");

function saveToCache(spec: unknown) {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  writeFileSync(CACHE_FILE, JSON.stringify(spec));
}

function loadFromCache(): unknown {
  return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
}

export async function fetchWithRetry(
  url: string,
  maxAttempts = 5,
  delayMs = 5000,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);

      if (response.ok) return response.json();

      throw new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const message = getErrorMessage(error);

      if (isLastAttempt) {
        if (isProduction) {
          Sentry.captureException(error, {
            tags: { source: "openapi-fetch", url },
            extra: { maxAttempts, finalAttempt: attempt },
          });
        } else {
          console.error(
            `[openapi] Failed after ${maxAttempts} attempts:`,
            message,
          );
        }

        throw error;
      }

      if (isProduction) {
        Sentry.addBreadcrumb({
          category: "fetch",
          message: `[openapi] Fetch failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs / 1000}s...`,
          level: "warning",
          data: { url, error: message },
        });
      } else {
        console.warn(
          `[openapi] Fetch failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs / 1000}s...`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export const openapi = createOpenAPI({
  proxyUrl: "/api/proxy",
  input: {
    "solar-shading-estimator-api": async () => {
      if (existsSync(CACHE_FILE)) {
        return loadFromCache();
      }

      const spec = await fetchWithRetry(`${serverEnv.API_URL}/openapi.json`);
      saveToCache(spec);

      return spec;
    },
  },
});
