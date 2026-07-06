import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { getErrorMessage } from "../errors";

const mockFetch = mock(() =>
  Promise.resolve(new Response(null, { status: 200 })),
);

mock.module("@/env", () => ({
  serverEnv: {
    API_URL: "https://api.example.com",
    NODE_ENV: "test",
    SENTRY_AUTH_TOKEN: "test-token",
  },
}));

globalThis.fetch = mockFetch as unknown as typeof fetch;

spyOn(console, "warn").mockImplementation(() => {});
spyOn(console, "error").mockImplementation(() => {});

const { fetchWithRetry } = await import("../openapi");

describe("fetchWithRetry", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test("returns JSON on first successful response", async () => {
    const data = { openapi: "3.0.0" };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchWithRetry("https://api.example.com/openapi.json");

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("retries on non-ok response then succeeds", async () => {
    const data = { openapi: "3.0.0" };
    mockFetch
      .mockResolvedValueOnce(
        new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 502, statusText: "Bad Gateway" }),
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
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test("throws after exhausting all retries", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, { status: 503, statusText: "Service Unavailable" }),
    );

    try {
      await fetchWithRetry("https://api.example.com/openapi.json", 3, 0);
      throw new Error("expected fetchWithRetry to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(getErrorMessage(error)).toBe("503 Service Unavailable");
    }

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test("retries on network error then succeeds", async () => {
    const data = { openapi: "3.0.0" };

    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
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
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("throws after all retries on network error", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));

    try {
      await fetchWithRetry("https://api.example.com/openapi.json", 2, 0);
      throw new Error("expected fetchWithRetry to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(getErrorMessage(error)).toBe("fetch failed");
    }

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("stops after explicit maxAttempts is reached", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, { status: 500, statusText: "Error" }),
    );

    try {
      await fetchWithRetry("https://api.example.com/openapi.json", 5, 0);
      throw new Error("expected fetchWithRetry to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  test("calls fetch with correct URL", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await fetchWithRetry("https://custom.example.com/spec.json", 1, 0);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://custom.example.com/spec.json",
    );
  });
});
