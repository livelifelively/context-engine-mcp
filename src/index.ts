#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { startContextEngine } from "./lib/api.js";
import { createServer } from "http";
import { IncomingMessage, ServerResponse } from "http";
import {
  getClientIp,
  extractApiKey,
  setupCorsHeaders,
  sendErrorResponse,
  handlePreflightRequest,
  validateApiKey,
} from "./lib/server-utils.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Command } from "commander";

// CLI Configuration Types
interface CliOptions {
  transport: string;
  port: string;
  apiKey?: string;
  serverUrl?: string;
}

// Store SSE transports by session ID
const sseTransports: Record<string, SSEServerTransport> = {};

/**
 * Validates CLI options and exits if invalid
 */
function validateCliOptions(options: CliOptions): void {
  const allowedTransports = ["stdio", "http"];
  if (!allowedTransports.includes(options.transport)) {
    console.error(
      `Invalid --transport value: '${options.transport}'. Must be one of: stdio, http.`
    );
    process.exit(1);
  }

  const passedPortFlag = process.argv.includes("--port");
  const passedApiKeyFlag = process.argv.includes("--api-key");

  if (options.transport === "http" && passedApiKeyFlag) {
    console.error(
      "The --api-key flag is not allowed when using --transport http. Use header-based auth at the HTTP layer instead."
    );
    process.exit(1);
  }

  if (options.transport === "stdio" && passedPortFlag) {
    console.error("The --port flag is not allowed when using --transport stdio.");
    process.exit(1);
  }
}

/**
 * Creates a new server instance with all tools registered
 */
function createServerInstance(clientIp?: string, apiKey?: string, serverUrl?: string) {
  // Priority: CLI > ENV > MCP config > default
  const finalServerUrl =
    serverUrl || process.env.CONTEXT_ENGINE_SERVER_URL || "https://contextengine.in";
  const server = new McpServer(
    {
      name: "ContextEngine",
      version: "1.0.13",
    },
    {
      instructions: "Use this server to start the context engine.",
    }
  );

  server.registerTool(
    "start_context_engine",
    {
      title: "Start Context Engine",
      description: "Starts the context engine and returns a confirmation message.",
      inputSchema: {
        projectRoot: z.string().describe("The project root directory"),
      },
    },
    async (args) => {
      // Validate API key based on environment
      validateApiKey(apiKey, finalServerUrl);

      const startContextEngineResponse = await startContextEngine(
        args.projectRoot,
        clientIp,
        apiKey,
        finalServerUrl
      );

      return {
        content: [
          {
            type: "text",
            text: startContextEngineResponse,
          },
        ],
      };
    }
  );

  return server;
}

/**
 * Handles HTTP transport requests
 */
async function handleHttpTransport(
  req: IncomingMessage,
  res: ServerResponse,
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const requestServer = createServerInstance(clientIp, apiKey, serverUrl);
  await requestServer.connect(transport);
  await transport.handleRequest(req, res);
}

/**
 * Handles SSE transport requests
 */
async function handleSseTransport(
  req: IncomingMessage,
  res: ServerResponse,
  clientIp?: string,
  apiKey?: string,
  serverUrl?: string
): Promise<void> {
  const sseTransport = new SSEServerTransport("/messages", res);
  sseTransports[sseTransport.sessionId] = sseTransport;

  res.on("close", () => {
    delete sseTransports[sseTransport.sessionId];
  });

  const requestServer = createServerInstance(clientIp, apiKey, serverUrl);
  await requestServer.connect(sseTransport);
}

/**
 * Handles POST messages for SSE sessions
 */
async function handleSsePostMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId =
    new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("sessionId") ?? "";

  if (!sessionId) {
    sendErrorResponse(res, 400, "Missing sessionId parameter");
    return;
  }

  const sseTransport = sseTransports[sessionId];
  if (!sseTransport) {
    sendErrorResponse(res, 400, `No transport found for sessionId: ${sessionId}`);
    return;
  }

  await sseTransport.handlePostMessage(req, res);
}

/**
 * Creates HTTP server with port fallback logic
 */
function createServerWithFallback(initialPort: number, _maxAttempts = 10) {
  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`).pathname;

    setupCorsHeaders(res);

    if (req.method === "OPTIONS") {
      handlePreflightRequest(res);
      return;
    }

    try {
      const clientIp = getClientIp(req);
      const apiKey = extractApiKey(req);

      if (url === "/mcp") {
        await handleHttpTransport(req, res, clientIp, apiKey, cliOptions.serverUrl);
      } else if (url === "/sse" && req.method === "GET") {
        await handleSseTransport(req, res, clientIp, apiKey, cliOptions.serverUrl);
      } else if (url === "/messages" && req.method === "POST") {
        await handleSsePostMessage(req, res);
      } else if (url === "/ping") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("pong");
      } else {
        sendErrorResponse(res, 404, "Not found");
      }
    } catch (error) {
      console.error("Error handling request:", error);
      if (!res.headersSent) {
        sendErrorResponse(res, 500, "Internal Server Error");
      }
    }
  });

  const startServer = (port: number, _maxAttempts = 10) => {
    httpServer.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && port < initialPort + _maxAttempts) {
        console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1, _maxAttempts);
      } else {
        console.error(`Failed to start server: ${err.message}`);
        process.exit(1);
      }
    });

    httpServer.listen(port, () => {
      console.error(
        `ContextEngine Documentation MCP Server running on HTTP at http://localhost:${port}/mcp with SSE endpoint at /sse`
      );
    });
  };

  startServer(initialPort);
}

// Parse CLI arguments using commander
const program = new Command()
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", "3000")
  .option("--api-key <key>", "API key for authentication")
  .option("--server-url <url>", "custom server URL (defaults to https://contextengine.in)")
  .allowUnknownOption()
  .parse(process.argv);

const cliOptions = program.opts<CliOptions>();

// Validate CLI options
validateCliOptions(cliOptions);

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as "stdio" | "http";

// HTTP port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

async function main() {
  if (TRANSPORT_TYPE === "http") {
    const initialPort = CLI_PORT ?? 3000;
    createServerWithFallback(initialPort);
  } else {
    const server = createServerInstance(undefined, cliOptions.apiKey, cliOptions.serverUrl);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ContextEngine Documentation MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
