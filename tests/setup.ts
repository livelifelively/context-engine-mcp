import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { startApiMocks, stopApiMocks, resetApiMocks } from "./mocks/api-mocks.js";

/**
 * Global test setup and teardown
 *
 * This file handles:
 * - API mock server lifecycle (start/stop/reset)
 * - Global test cleanup
 */
beforeAll(() => {
  console.log("=== Global Test Setup ===");
  console.log("TEST_MODE:", process.env.TEST_MODE);

  // Start API mocks if in mock mode
  startApiMocks();
});

afterAll(() => {
  console.log("=== Global Test Teardown ===");

  // Stop API mocks if in mock mode
  stopApiMocks();
});

afterEach(() => {
  // Reset API mocks and clear vitest mocks between tests
  resetApiMocks();
  vi.clearAllMocks();
});
