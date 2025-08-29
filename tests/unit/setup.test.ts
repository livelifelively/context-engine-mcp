import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Load JSON fixtures
const apiResponses = JSON.parse(
  readFileSync(join(__dirname, "../fixtures/api-responses.json"), "utf8")
);
const mcpRequests = JSON.parse(
  readFileSync(join(__dirname, "../fixtures/mcp-requests.json"), "utf8")
);

describe("Test Setup", () => {
  it("should have access to test fixtures", () => {
    expect(apiResponses).toBeDefined();
    expect(apiResponses["start-context-engine"]).toBeDefined();

    expect(mcpRequests).toBeDefined();
    expect(mcpRequests.initialize).toBeDefined();
  });

  it("should have proper MCP request structure", () => {
    const initRequest = mcpRequests.initialize.request;
    expect(initRequest).toHaveProperty("jsonrpc");
    expect(initRequest).toHaveProperty("id");
    expect(initRequest).toHaveProperty("method");
    expect(initRequest).toHaveProperty("params");
    expect(initRequest.jsonrpc).toBe("2.0");
    expect(initRequest.method).toBe("initialize");
  });

  it("should have proper MCP response structure", () => {
    const initResponse = mcpRequests.initialize.response;
    expect(initResponse).toHaveProperty("jsonrpc");
    expect(initResponse).toHaveProperty("id");
    expect(initResponse).toHaveProperty("result");
    expect(initResponse.jsonrpc).toBe("2.0");
    expect(initResponse.result).toHaveProperty("protocolVersion");
    expect(initResponse.result).toHaveProperty("serverInfo");
  });
});
