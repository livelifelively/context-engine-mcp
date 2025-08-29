import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MCPTestUtils } from "../utils/mcp-test-utils.js";

describe("MCP Server Integration", () => {
  beforeAll(async () => {
    await MCPTestUtils.setupClient();
  });

  afterAll(async () => {
    await MCPTestUtils.cleanupClient();
  });

  it("should execute start_context_engine tool and return valid response", async () => {
    // Skip this test in CI environment to avoid process spawning issues
    if (process.env.CI) {
      console.log("Skipping MCP server integration test in CI environment");
      return;
    }

    if (MCPTestUtils.skipIfNotConnected("start_context_engine test")) return;

    // This test calls the local MCP server, which then calls the configured API
    // Flow: Test → MCP Client → Local MCP Server → API (local or remote)
    const result = await MCPTestUtils.client.callTool({
      name: "start_context_engine",
      arguments: {},
    });

    const content = result.content as any[];
    const responseText = content[0].text;
    console.log("MCP Tool Response:", responseText);

    // Test tool functionality - should return a valid response
    expect(responseText).toBeDefined();
    expect(typeof responseText).toBe("string");
    expect(responseText.length).toBeGreaterThan(0);
  });
});
