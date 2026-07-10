import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as Sentry from "@sentry/nextjs";
import { createOpenAPI } from "fumadocs-openapi/server";
import * as v from "valibot";
import { serverEnv } from "@/env";
import { getErrorMessage } from "./errors";

const isProduction = serverEnv.NODE_ENV === "production";

const CACHE_DIR = ".cache";
const CACHE_FILE = join(CACHE_DIR, "openapi-spec.json");

const openApiSpecSchema = v.union([
  v.looseObject({ openapi: v.string() }),
  v.looseObject({ swagger: v.string() }),
]);

function saveToCache(spec: Record<string, unknown>) {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  writeFileSync(CACHE_FILE, JSON.stringify(spec));
}

function loadFromCache() {
  try {
    const raw = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    const result = v.safeParse(openApiSpecSchema, raw);

    return result.success ? result.output : null;
  } catch {
    return null;
  }
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
      const cached = loadFromCache();

      if (cached) return cached;

      const raw = await fetchWithRetry(`${serverEnv.API_URL}/openapi.json`);
      const result = v.safeParse(openApiSpecSchema, raw);

      if (!result.success) {
        const message = `[openapi] Fetched spec failed validation: ${v.summarize(result.issues)}`;

        if (isProduction) {
          Sentry.captureException(new Error(message), {
            tags: { source: "openapi-validation" },
            extra: { issues: result.issues },
          });
        } else {
          console.error(message);
        }

        throw new Error(message);
      }

      saveToCache(result.output);

      return raw;
    },
  },
});
