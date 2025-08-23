import { IncomingMessage, ServerResponse } from "http";

/**
 * Extracts client IP from request headers
 */
export function getClientIp(req: IncomingMessage): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];

  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ipList = ips.split(",").map((ip) => ip.trim());

    for (const ip of ipList) {
      const plainIp = ip.replace(/^::ffff:/, "");
      if (
        !plainIp.startsWith("10.") &&
        !plainIp.startsWith("192.168.") &&
        !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(plainIp)
      ) {
        return plainIp;
      }
    }
    return ipList[0].replace(/^::ffff:/, "");
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return undefined;
}

/**
 * Extracts header value safely, handling both string and string[] cases
 */
export function extractHeaderValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value[0];
}

/**
 * Extracts Authorization header and removes Bearer prefix if present
 */
export function extractBearerToken(authHeader: string | string[] | undefined): string | undefined {
  const header = extractHeaderValue(authHeader);
  if (!header) return undefined;

  if (header.startsWith("Bearer ")) {
    return header.substring(7).trim();
  }
  return header;
}

/**
 * Extracts API key from request headers in order of preference
 */
export function extractApiKey(req: IncomingMessage): string | undefined {
  return (
    extractBearerToken(req.headers.authorization) ||
    extractHeaderValue(req.headers["ContextEngine-API-Key"]) ||
    extractHeaderValue(req.headers["context-engine-api-key"]) ||
    extractHeaderValue(req.headers["X-API-Key"]) ||
    extractHeaderValue(req.headers["x-api-key"])
  );
}

/**
 * Sets up CORS headers for HTTP responses
 */
export function setupCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-ContextEngine-API-Key, ContextEngine-API-Key, X-API-Key, Authorization"
  );
  res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");
}

/**
 * Sends error response with consistent formatting
 */
export function sendErrorResponse(res: ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode);
  res.end(message);
}

/**
 * Handles preflight OPTIONS requests
 */
export function handlePreflightRequest(res: ServerResponse): void {
  res.writeHead(200);
  res.end();
}
