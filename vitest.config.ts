import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  cacheDir: "node_modules/.vitest",
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    // Performance optimizations
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // File patterns
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/", "**/*.d.ts", "**/*.config.*", "coverage/**"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Reporter configuration
    reporters: process.env.CI ? ["junit", "github-actions"] : ["default"],
    outputFile: process.env.CI ? "test-results.xml" : undefined,

    // Retry configuration for flaky tests
    retry: process.env.CI ? 2 : 0,

    // Bail configuration
    bail: process.env.CI ? 5 : 0,

    // Reduce test isolation overhead
    isolate: true,

    // Note: Cache configuration moved to Vite's cacheDir
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
