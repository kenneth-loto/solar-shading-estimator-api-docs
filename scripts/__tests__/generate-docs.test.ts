import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

const mockGenerateFiles = mock(() => Promise.resolve());

const mockExistsSync = mock((_path: string) => true);
const mockMkdirSync = mock((_path: string, _options?: object) => undefined);
const mockReadFileSync = mock((path: string) => {
  if (path.includes("api-reference/meta.json")) {
    return JSON.stringify({ pages: ["get-irradiance", "get-shading"] });
  }

  if (path.includes("docs/meta.json")) {
    return JSON.stringify({
      pages: ["index", "---Api Reference---", "api-reference/old-endpoint"],
    });
  }

  throw new Error(`No mock for ${path}`);
});

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
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
};

mock.module("node:fs", () => ({
  ...fsMock,
  default: fsMock,
}));

spyOn(console, "log").mockImplementation(() => {});
spyOn(console, "error").mockImplementation(() => {});
spyOn(process, "exit").mockImplementation(() => undefined as never);

const { syncRootMeta, generateDocs } = await import("../generate-docs");

describe("generateDocs", () => {
  test("calls generateFiles with correct config", async () => {
    await generateDocs();

    expect(mockGenerateFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        output: "./content/docs/api-reference",
        per: "operation",
        groupBy: "tag",
      }),
    );
  });
});

function getLastWriteCall() {
  const call = mockWriteFileSync.mock.calls.at(-1);

  if (!call) throw new Error("writeFileSync was never called");

  const [filePath, data] = call;

  return { filePath, data };
}

function getWrittenJson() {
  const { data } = getLastWriteCall();

  return JSON.parse(data) as { pages: string[] };
}

describe("syncRootMeta", () => {
  beforeEach(() => {
    mockWriteFileSync.mockClear();
    mockReadFileSync.mockClear();
  });

  test("writes merged meta.json with API reference pages", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["get-irradiance", "get-shading"] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({
          pages: ["index", "---Api Reference---", "api-reference/old-endpoint"],
        });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toEqual([
      "index",
      "---Api Reference---",
      "api-reference/get-irradiance",
      "api-reference/get-shading",
    ]);
  });

  test("preserves non-API pages from existing root meta", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["get-irradiance"] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({
          pages: [
            "index",
            "getting-started",
            "---Api Reference---",
            "api-reference/old",
          ],
        });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toContain("getting-started");
    expect(written.pages).toContain("---Api Reference---");
    expect(written.pages).toContain("api-reference/get-irradiance");
    expect(written.pages).not.toContain("api-reference/old");
  });

  test("uses fallback when root meta.json does not exist", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["create-item"] });
      }

      if (path.includes("docs/meta.json")) {
        throw new Error("ENOENT: no such file or directory");
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toEqual([
      "index",
      "---Api Reference---",
      "api-reference/create-item",
    ]);
  });

  test("appends marker and API pages when root meta has no marker yet", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["get-weather"] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({ pages: ["index", "installation"] });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toEqual([
      "index",
      "installation",
      "---Api Reference---",
      "api-reference/get-weather",
    ]);
  });

  test("handles empty API reference pages", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: [] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({ pages: ["index"] });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toEqual(["index", "---Api Reference---"]);
  });

  test("removes old API reference entries before merging", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["new-endpoint"] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({
          pages: [
            "index",
            "guide",
            "---Api Reference---",
            "api-reference/old-a",
            "api-reference/old-b",
          ],
        });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const written = getWrittenJson();

    expect(written.pages).toEqual([
      "index",
      "guide",
      "---Api Reference---",
      "api-reference/new-endpoint",
    ]);
  });

  test("propagates when api-reference meta.json is missing", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        throw new Error("ENOENT: no such file or directory");
      }

      return JSON.stringify({ pages: ["index"] });
    });

    expect(() => syncRootMeta()).toThrow("ENOENT");
  });

  test("writeFileSync is called with formatted JSON", () => {
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes("api-reference/meta.json")) {
        return JSON.stringify({ pages: ["endpoint-a"] });
      }

      if (path.includes("docs/meta.json")) {
        return JSON.stringify({ pages: ["index"] });
      }

      throw new Error(`No mock for ${path}`);
    });

    syncRootMeta();

    const { filePath, data } = getLastWriteCall();

    expect(filePath).toBe("./content/docs/meta.json");
    expect(data).toContain("\n");
    expect(data).toContain("  ");
  });
});
