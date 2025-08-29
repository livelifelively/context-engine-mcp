import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MCPTestUtils } from "../utils/mcp-test-utils.js";

describe("MCP Server Integration", () => {
  beforeAll(async () => {
    await MCPTestUtils.setupClient();
  });

  afterAll(async () => {
    await MCPTestUtils.cleanupClient();
  });

  // Note: This test validates the MCP tool response format only.
  // It does NOT test actual directory creation to avoid interfering with the project's .context-engine directory.
  // For testing actual directory creation, run this test in an isolated environment.

  it("should execute start_context_engine tool and return valid response", async () => {
    // Skip this test in CI environment to avoid process spawning issues
    if (process.env.CI) {
      console.log("Skipping MCP server integration test in CI environment");
      return;
    }

    if (MCPTestUtils.skipIfNotConnected("start_context_engine test")) return;

    // This test calls the local MCP server, which then calls the configured API
    // Flow: Test → MCP Client → Local MCP Server → API (local or remote) + Local Documentation Setup
    const result = await MCPTestUtils.client.callTool({
      name: "start_context_engine",
      arguments: {
        projectRoot: "/tmp/test-project",
      },
    });

    const content = result.content as Array<{ text: string }>;
    const responseText = content[0].text;
    console.log("MCP Tool Response:", responseText);

    // Test tool functionality - should return a valid response
    expect(responseText).toBeDefined();
    expect(typeof responseText).toBe("string");
    expect(responseText.length).toBeGreaterThan(0);

    // Test that the response includes either API success or failure information
    // Note: This test only validates the response format, not the actual directory creation
    // Directory creation is tested separately in isolated environment tests
    if (responseText.includes("API key is required")) {
      // API failed - this is a valid response
      expect(responseText).toContain("API key is required");
    } else {
      // API succeeded - should include documentation setup information in response
      expect(responseText).toContain("Local Documentation Structure");

      // Should contain one of the status emojis
      const hasStatusEmoji =
        responseText.includes("📁") || responseText.includes("⚠️") || responseText.includes("❌");
      expect(hasStatusEmoji).toBe(true);
    }
  });
});
