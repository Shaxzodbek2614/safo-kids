import type { NextConfig } from "next";

// `PAGES_BASE_PATH=/safo-kids npm run build` produces the static demo for
// GitHub Pages in out/. A plain build stays a normal server build.
const pagesBase = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  // Partial prerendering is not available in export mode.
  cacheComponents: pagesBase === undefined,
  partialPrefetching: pagesBase === undefined,
  ...(pagesBase !== undefined && {
    output: "export",
    basePath: pagesBase,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
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
