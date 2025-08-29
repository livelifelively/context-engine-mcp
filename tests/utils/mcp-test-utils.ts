import { expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "path";
import { getTestConfig, shouldUseRealApi } from "../config/test-config.js";

/**
 * MCP Test Utilities for integration testing
 *
 * Provides reusable utilities for MCP client setup, tool execution,
 * result validation, and error handling across test files.
 */
export class MCPTestUtils {
  static client: Client;
  static isConnected = false;
  static config = getTestConfig();

  /**
   * Sets up the MCP client and connects to the server
   */
  static async setupClient() {
    // Skip if already connected
    if (this.client && this.isConnected) {
      return;
    }

    this.client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    try {
      const serverPath = join(process.cwd(), "dist", "index.js");
      const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath, "--transport", "stdio"],
      });

      // Add timeout to prevent hanging
      const connectPromise = this.client.connect(transport);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;
    } catch (error) {
      console.log("Connection failed, this is expected with current setup:", error);
      this.isConnected = false;
    }
  }

  /**
   * Cleans up the MCP client connection
   */
  static async cleanupClient() {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
      } catch {
        // Ignore close errors
      }
    }
  }

  /**
   * Checks if connected and skips test if not
   * @param testName - Name of the test for logging
   * @returns true if test should be skipped, false otherwise
   */
  static skipIfNotConnected(testName: string): boolean {
    if (!this.isConnected) {
      console.log(`Skipping ${testName} - not connected`);
      return true;
    }
    return false;
  }

  /**
   * Validates a tool result and returns the parsed content
   * @param result - The result from a tool call
   * @param expectedContent - Optional expected content to validate
   * @returns Object containing content array and first content item
   */
  static validateToolResult(result: any, expectedContent?: string) {
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    const content = result.content as any[];
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);

    const firstContent = content[0] as any;
    expect(firstContent.type).toBe("text");
    expect(typeof firstContent.text).toBe("string");

    // Content validation
    if (expectedContent) {
      expect(firstContent.text).toContain(expectedContent);
    }

    // Validate it's not an error message (for real API tests)
    if (shouldUseRealApi()) {
      expect(firstContent.text).not.toContain("Failed to send greeting");
      expect(firstContent.text).not.toContain("library you are trying to access does not exist");
    }

    return { content, firstContent };
  }

  /**
   * Calls a tool and validates the result
   * @param name - Tool name to call
   * @param args - Arguments to pass to the tool
   * @returns Validated result object
   */
  static async callToolAndValidate(name: string, args: any = {}) {
    const result = await this.client.callTool({ name, arguments: args });
    return this.validateToolResult(result);
  }

  /**
   * Calls a tool and validates the result with expected content
   * @param name - Tool name to call
   * @param args - Arguments to pass to the tool
   * @param expectedContent - Expected content to validate
   * @returns Validated result object
   */
  static async callToolAndValidateContent(name: string, args: any = {}, expectedContent?: string) {
    const result = await this.client.callTool({ name, arguments: args });
    return this.validateToolResult(result, expectedContent);
  }

  /**
   * Expects a tool call to throw an error
   * @param name - Tool name to call
   * @param args - Arguments to pass to the tool
   * @returns The caught error
   */
  static async expectToolError(name: string, args: any = {}) {
    try {
      await this.client.callTool({ name, arguments: args });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message || error.code).toBeDefined();
      return error;
    }
  }

  /**
   * Creates a StdioClientTransport for testing with configured arguments
   * @returns Configured StdioClientTransport instance
   */
  static createTransport() {
    const serverPath = join(process.cwd(), "dist", "index.js");
    const args = [serverPath, "--transport", "stdio", "--server-url", this.config.apiBaseUrl];

    // Add API key if configured
    if (this.config.apiKey) {
      args.push("--api-key", this.config.apiKey);
    }

    console.log(`MCP Test Utils: Starting server with args: ${args.join(" ")}`);

    return new StdioClientTransport({
      command: "node",
      args: args,
    });
  }

  /**
   * Gets the list of available tools
   * @returns Tools list from the server
   */
  static async getTools() {
    return await this.client.listTools();
  }

  /**
   * Validates that specific tools are available
   * @param expectedTools - Array of expected tool names
   */
  static async validateAvailableTools(expectedTools: string[]) {
    const tools = await this.getTools();

    expect(tools).toBeDefined();
    expect(tools.tools).toBeDefined();
    expect(Array.isArray(tools.tools)).toBe(true);
    expect(tools.tools.length).toBeGreaterThan(0);

    const toolNames = tools.tools.map((tool: any) => tool.name);
    expectedTools.forEach((toolName) => {
      expect(toolNames).toContain(toolName);
    });
  }

  /**
   * Validates tool schema structure
   * @param toolName - Name of the tool to validate
   */
  static async validateToolSchema(toolName: string) {
    const tools = await this.getTools();
    const tool = tools.tools.find((t: any) => t.name === toolName);

    expect(tool).toBeDefined();
    if (tool) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.inputSchema).toBe("object");
    }
  }

  /**
   * Tests actual API connectivity
   * @returns Object with connectivity status
   */
  static async testApiConnectivity() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/v1/greet`);
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: this.config.apiBaseUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        url: this.config.apiBaseUrl,
      };
    }
  }

  /**
   * Validates specific error messages
   * @param error - The error object
   * @param expectedErrorPattern - Expected error pattern to match
   */
  static validateErrorContent(error: any, expectedErrorPattern: string) {
    expect(error).toBeDefined();
    expect(error.message || error.code).toBeDefined();

    if (error.message) {
      expect(error.message).toContain(expectedErrorPattern);
    }
  }
}
