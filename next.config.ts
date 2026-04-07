import type { NextConfig } from "next";

// Node.js 25+ has experimental localStorage on globalThis,
// but getItem is not a function without --localstorage-file.
// This crashes Next.js SSR. Remove it to prevent the error.
if (
  typeof globalThis.localStorage !== "undefined" &&
  typeof globalThis.localStorage.getItem !== "function"
) {
  delete (globalThis as Record<string, unknown>).localStorage;
}

const nextConfig: NextConfig = {};

export default nextConfig;
