import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

export const serverEnv = createEnv({
  server: {
    API_URL: v.pipe(v.string(), v.url()),
    // VERCEL_OIDC_TOKEN: v.pipe(v.string(), v.minLength(1)),
    SENTRY_AUTH_TOKEN: v.pipe(v.string(), v.minLength(1)),
    NODE_ENV: v.optional(
      v.picklist(["development", "test", "production"]),
      "development",
    ),
  },
  /*
   * For Next.js >= 13.4.4, we can pass the entire process.env to the server runtime.
   * This is safe on the server because this file is never imported by client code.
   */
  experimental__runtimeEnv: process.env,
});
