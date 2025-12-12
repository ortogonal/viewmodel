// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Co-located tests
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["dist/**", "node_modules/**"],

    // Default environment for non-React tests
    environment: "node",

    // Use jsdom for React tests (typically .test.tsx)
    environmentMatchGlobs: [
      ["src/**/*.test.tsx", "jsdom"],
      ["src/**/react*.test.{ts,tsx}", "jsdom"],
    ],

    // Nice defaults
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Optional: add a setup file if you want jest-dom, global mocks, etc.
    // setupFiles: ["src/test/setup.ts"],
  },
});
