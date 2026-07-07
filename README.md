# Solar Shading Estimator API — Docs

## What this is

The documentation site for the [Solar Shading Estimator API](https://github.com/kenneth-loto/solar-shading-estimator-api) — a [Fumadocs](https://fumadocs.dev) + Next.js site that renders API reference pages generated directly from the API's OpenAPI spec, alongside hand-written guides.

Rather than maintaining API reference docs by hand, this site fetches the live OpenAPI schema from the API itself and generates per-operation MDX pages from it, so the reference docs stay in sync with the actual API without manual upkeep.

## Why it exists

Hand-written API references drift out of date as endpoints change. This site pulls the OpenAPI spec straight from the deployed API and regenerates the reference pages from it, so "what's documented" and "what's deployed" don't diverge.

## Tech stack

| Layer                    | What                                                            |
| ------------------------ | --------------------------------------------------------------- |
| **Framework**            | Next.js 16 (App Router)                                         |
| **Runtime**              | Bun (primary), Node.js                                          |
| **Language**             | TypeScript                                                      |
| **Docs framework**       | [Fumadocs](https://fumadocs.dev) with Fumadocs MDX collections  |
| **OpenAPI generation**   | [`fumadocs-openapi`](https://fumadocs.dev/docs/ui/openapi)      |
| **Styling**              | Tailwind CSS v4 + PostCSS + `tw-animate-css` + `tailwind-merge` |
| **UI components**        | shadcn/ui + [Base UI](https://base-ui.com/react) + Lucide icons |
| **Linting / formatting** | [Biome](https://biomejs.dev)                                    |
| **Env validation**       | `@t3-oss/env-nextjs` + [Valibot](https://valibot.dev)           |
| **Error monitoring**     | [Sentry](https://sentry.io/)                                    |
| **Analytics**            | Vercel Analytics + Speed Insights                               |
| **Git hooks**            | Husky + commitlint + lint-staged                                |
| **Testing**              | `bun test`                                                      |
| **Deployment**           | [Vercel](https://vercel.com/)                                   |

## How the API reference is generated

The reference pages aren't written by hand — they're generated from the API's OpenAPI spec via a script (`scripts/generate-docs.ts`) that:

1. Fetches the OpenAPI spec from the live API (`API_URL/openapi.json`), retrying up to 5 times with a delay between attempts in case the API is asleep (Render free tier) or briefly unavailable.
2. Runs `fumadocs-openapi`'s `generateFiles()` against that spec, writing one MDX page per operation into `content/docs/api-reference`, grouped by OpenAPI tag, with frontmatter (title/description) derived from each operation.
3. Syncs the root sidebar (`content/docs/meta.json`) so an "API Reference" section pointing at the generated pages is kept up to date, while preserving any other hand-authored sidebar entries.

In production, a failed spec fetch (after all retries) is reported to Sentry rather than crashing the build silently; in development it just logs to the console.

Re-run this generation step whenever the API's OpenAPI spec changes, so the reference pages pick up new/changed endpoints.

## Explore

| Path                         | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `lib/source.ts`              | Content source adapter — `loader()` provides the content API.     |
| `lib/layout.shared.tsx`      | Shared layout options.                                            |
| `lib/openapi.ts`             | Configures the OpenAPI source and fetches the live spec.          |
| `lib/shared.ts`              | Shared route helpers.                                             |
| `lib/cn.ts`                  | `cn()` utility (class-variance-authority + tailwind-merge).       |
| `lib/errors.ts`              | Error-class helpers for structured failure handling.              |
| `scripts/generate-docs.ts`   | The spec-fetch + MDX generation script.                           |
| `proxy.ts`                   | Fumadocs content-negotiation proxy middleware.                    |
| `env/`                       | Client/server/shared env schemas with Valibot validation.         |
| `instrumentation.ts`         | Next.js instrumentation — registers Sentry.                       |
| `app/(home)`                 | Route group for the landing page.                                 |
| `app/docs`                   | Documentation layout and pages.                                   |
| `app/api/search/route.ts`    | Route handler for search.                                         |
| `content/docs/api-reference` | Generated API reference pages — do not edit directly.             |
| `source.config.ts`           | Fumadocs MDX config — frontmatter schemas and collection options. |

## Getting started

```bash
bun install
bun run dev
```

Or with npm / pnpm:

```bash
npm install
npm run dev
```

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Regenerating the API reference

```bash
bun run generate:docs
```

Requires `API_URL` to point at a running instance of the API. This is also wired into `predev` and `prebuild`, so it runs automatically before the dev server or production build.

## What it does NOT do (limitations / out of scope)

- **No content editing UI.** MDX guides are written and edited directly in the repo.
- **Reference pages are generated, not hand-written.** Editing files under `content/docs/api-reference` directly will be overwritten the next time the generation script runs — change the API's OpenAPI spec (or annotations that produce it) instead.
- **No authentication.** The site is public, matching the API's current single-user/demo scope.
- **Spec freshness depends on the API being reachable.** If the API is asleep (Render free tier) or unreachable at generation time, generation retries for a bit and then fails — it doesn't fall back to a stale cached spec.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Fumadocs](https://fumadocs.dev) — the docs framework powering this site.
- [`fumadocs-openapi`](https://fumadocs.dev/docs/ui/openapi) — OpenAPI reference generation.
- [Biome](https://biomejs.dev) — linter and formatter.
- [Valibot](https://valibot.dev) — schema validation library.

## License

MIT — see [LICENSE](LICENSE).
