import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

const mockGenerateFiles = mock(() =>
  Promise.reject(new Error("openapi spec fetch failed")),
);
const mockReadFileSync = mock((_path: string) => "{}");
const mockWriteFileSync = mock((_path: string, _data: string) => {});

mock.module("@/env", () => ({
  serverEnv: {
    API_URL: "https://api.example.com",
    NODE_ENV: "test",
    SENTRY_AUTH_TOKEN: "test-token",
  },
}));

mock.module("fumadocs-openapi", () => ({
  generateFiles: mockGenerateFiles,
}));

const fsMock = {
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
};

mock.module("node:fs", () => ({ ...fsMock, default: fsMock }));

const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
const processExitSpy = spyOn(process, "exit").mockImplementation(
  () => undefined as never,
);
const { main } = await import("../generate-docs");

describe("generate-docs entrypoint failure", () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
    processExitSpy.mockClear();
  });

  test("logs the error and exits with code 1 when generateDocs rejects", async () => {
    await main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to generate docs:",
      "openapi spec fetch failed",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
