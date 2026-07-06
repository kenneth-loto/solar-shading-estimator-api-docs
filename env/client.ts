import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_SITE_URL: v.pipe(v.string(), v.url()),
    NEXT_PUBLIC_SENTRY_DSN: v.pipe(v.string(), v.url()),
  },
  /*
   * Client-side variables MUST be explicitly destructured so Next.js
   * can statically analyze and inline them into the browser bundle.
   */
  runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
});
