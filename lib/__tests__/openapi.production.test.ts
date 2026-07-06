import { beforeEach, describe, expect, mock, test } from "bun:test";

interface SentryCaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

interface SentryBreadcrumb {
  category: string;
  message?: string;
  level: string;
  data?: Record<string, unknown>;
}

const mockFetch = mock(() =>
  Promise.resolve(new Response(null, { status: 200 })),
);

const mockCaptureException = mock(
  (_error: unknown, _context?: SentryCaptureContext) => undefined,
);

const mockAddBreadcrumb = mock((_breadcrumb: SentryBreadcrumb) => undefined);

mock.module("@/env", () => ({
  serverEnv: {
    API_URL: "https://api.example.com",
    NODE_ENV: "production",
    SENTRY_AUTH_TOKEN: "test-token",
  },
}));

mock.module("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
  addBreadcrumb: mockAddBreadcrumb,
}));

globalThis.fetch = mockFetch as unknown as typeof fetch;

const { fetchWithRetry } = await import("../openapi");

describe("fetchWithRetry (production)", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockCaptureException.mockClear();
    mockAddBreadcrumb.mockClear();
  });

  test("adds a breadcrumb on a retryable failure instead of logging", async () => {
    const data = { openapi: "3.0.0" };

    mockFetch
      .mockResolvedValueOnce(
        new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await fetchWithRetry(
      "https://api.example.com/openapi.json",
      5,
      0,
    );

    expect(result).toEqual(data);
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);

    const call = mockAddBreadcrumb.mock.calls[0];

    expect(call).toBeDefined();

    if (!call) return;

    const [breadcrumb] = call;

    expect(breadcrumb.category).toBe("fetch");
    expect(breadcrumb.level).toBe("warning");
    expect(breadcrumb.data?.url).toBe("https://api.example.com/openapi.json");

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  test("captures exception to Sentry on final failure", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, { status: 503, statusText: "Service Unavailable" }),
    );

    try {
      await fetchWithRetry("https://api.example.com/openapi.json", 3, 0);
      throw new Error("expected fetchWithRetry to throw");
    } catch {
      // failure path under test; assertions happen below
    }

    expect(mockCaptureException).toHaveBeenCalledTimes(1);

    const call = mockCaptureException.mock.calls[0];

    expect(call).toBeDefined();

    if (!call) return;

    const [capturedError, context] = call;

    expect(capturedError).toBeInstanceOf(Error);

    if (capturedError instanceof Error) {
      expect(capturedError.message).toBe("503 Service Unavailable");
    }

    expect(context).toEqual(
      expect.objectContaining({
        tags: {
          source: "openapi-fetch",
          url: "https://api.example.com/openapi.json",
        },
        extra: { maxAttempts: 3, finalAttempt: 3 },
      }),
    );
  });

  test("does not call Sentry on first-attempt success", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await fetchWithRetry("https://api.example.com/openapi.json", 1, 0);

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });
});
