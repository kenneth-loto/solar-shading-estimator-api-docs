import { readFileSync, writeFileSync } from "node:fs";
import { generateFiles } from "fumadocs-openapi";
import { getErrorMessage } from "@/lib/errors.js";
import { openapi } from "../lib/openapi.js";

export interface MetaJson {
  pages: string[];
}

export async function generateDocs() {
  await generateFiles({
    input: openapi,
    output: "./content/docs/api-reference",
    per: "operation",
    groupBy: "tag",
    includeDescription: true,
    meta: true,
    frontmatter: (title, description) => ({
      title,
      description,
      full: true,
    }),
  });
}

export function syncRootMeta() {
  const apiMeta = JSON.parse(
    readFileSync("./content/docs/api-reference/meta.json", "utf-8"),
  ) as MetaJson;

  let rootMeta: MetaJson = { pages: ["index"] };
  try {
    rootMeta = JSON.parse(
      readFileSync("./content/docs/meta.json", "utf-8"),
    ) as MetaJson;
  } catch {
    // no root meta.json yet — use the fallback above
  }

  const preservedPages = rootMeta.pages.filter(
    (page) =>
      page !== "---Api Reference---" && !page.startsWith("api-reference/"),
  );

  const updatedMeta: MetaJson = {
    pages: [
      ...preservedPages,
      "---Api Reference---",
      ...apiMeta.pages.map((page) => `api-reference/${page}`),
    ],
  };

  writeFileSync(
    "./content/docs/meta.json",
    JSON.stringify(updatedMeta, null, 2),
  );
}

export async function main() {
  try {
    await generateDocs();
    syncRootMeta();

    console.log("OpenAPI docs and root sidebar structure synchronized.");
  } catch (error) {
    console.error("Failed to generate docs:", getErrorMessage(error));

    process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
