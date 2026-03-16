import path from "node:path";
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.SWARMIFYX_E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_DIR =
  process.env.SWARMIFYX_E2E_DATA_DIR ??
  path.resolve(process.cwd(), "test-results", `e2e-data-${PORT}-${Date.now()}`);

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  // Start the local dev server once for the E2E run against an isolated home dir.
  webServer: {
    command: "pnpm dev:once",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !!process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PORT: String(PORT),
      SWARMIFYX_HOME: DATA_DIR,
    },
  },
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./playwright-report" }]],
});
