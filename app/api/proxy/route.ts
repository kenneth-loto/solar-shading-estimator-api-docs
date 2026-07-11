import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_HOST = "solar-shading-estimator-api.onrender.com";
const ALLOWED_ORIGIN = `https://${ALLOWED_HOST}`;

async function handler(req: NextRequest) {
  const targetUrlStr = req.nextUrl.searchParams.get("url");
  const cookie = req.nextUrl.searchParams.get("cookie");

  if (!targetUrlStr) {
    return Response.json({ error: "URL parameter required" }, { status: 400 });
  }

  const strippedTarget = targetUrlStr.startsWith(ALLOWED_ORIGIN)
    ? targetUrlStr.slice(ALLOWED_ORIGIN.length) || "/"
    : targetUrlStr;

  if (strippedTarget.includes("://") || strippedTarget.startsWith("//")) {
    return Response.json(
      { error: "Absolute URLs are not allowed" },
      { status: 400 },
    );
  }

  const normalizedTarget = strippedTarget.startsWith("/")
    ? strippedTarget
    : `/${strippedTarget}`;

  let targetUrl: URL;
  try {
    targetUrl = new URL(normalizedTarget, ALLOWED_ORIGIN);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (targetUrl.origin !== ALLOWED_ORIGIN) {
    return Response.json({ error: "Host not allowed" }, { status: 400 });
  }

  if (targetUrl.pathname.split("/").includes("..")) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  const headers = new Headers();

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const ct = req.headers.get("content-type");

  if (ct) {
    headers.set("content-type", ct);
  }

  const accept = req.headers.get("accept");

  if (accept) {
    headers.set("accept", accept);
  }

  const apiKey = req.headers.get("x-api-key");

  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  try {
    const apiRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: METHODS_WITH_BODY.has(req.method)
        ? await req.arrayBuffer()
        : undefined,
      cache: "no-store",
    });

    return new Response(apiRes.body, {
      status: apiRes.status,
      statusText: apiRes.statusText,
      headers: {
        "content-type":
          apiRes.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    if (isProduction) {
      Sentry.captureException(error, {
        tags: { source: "api-proxy" },
        extra: { targetUrl: targetUrlStr, method: req.method },
      });
    } else {
      console.error("[proxy] fetch failed:", error);
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const HEAD = handler;
export const PUT = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
