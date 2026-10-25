import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The production build type-checks app code only, so it works even when the
  // host skips devDependencies (tests need vitest). `npm run typecheck` still checks tests.
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
