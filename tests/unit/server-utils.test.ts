import { describe, it, expect, vi } from "vitest";
import {
  getClientIp,
  extractHeaderValue,
  extractBearerToken,
  extractApiKey,
  setupCorsHeaders,
  sendErrorResponse,
  handlePreflightRequest,
} from "../../src/lib/server-utils.js";
import { IncomingMessage, ServerResponse } from "http";

// Mock ServerResponse
const createMockResponse = () => {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    writeHead: vi.fn(),
    end: vi.fn(),
    headersSent: false,
  } as unknown as ServerResponse;

  return { res, headers };
};

describe("Server Utils", () => {
  describe("extractHeaderValue", () => {
    it("should return undefined for null/undefined values", () => {
      expect(extractHeaderValue(undefined)).toBeUndefined();
      expect(extractHeaderValue(null as any)).toBeUndefined();
    });

    it("should return string value as is", () => {
      expect(extractHeaderValue("test-value")).toBe("test-value");
    });

    it("should return first value from array", () => {
      expect(extractHeaderValue(["first", "second"])).toBe("first");
    });

    it("should return undefined from empty array", () => {
      expect(extractHeaderValue([])).toBeUndefined();
    });
  });

  describe("extractBearerToken", () => {
    it("should return undefined for null/undefined values", () => {
      expect(extractBearerToken(undefined)).toBeUndefined();
      expect(extractBearerToken(null as any)).toBeUndefined();
    });

    it("should return value without Bearer prefix", () => {
      expect(extractBearerToken("Bearer test-token")).toBe("test-token");
    });

    it("should return value with Bearer prefix and extra spaces", () => {
      expect(extractBearerToken("Bearer  test-token  ")).toBe("test-token");
    });

    it("should return value as is when no Bearer prefix", () => {
      expect(extractBearerToken("test-token")).toBe("test-token");
    });

    it("should handle array values", () => {
      expect(extractBearerToken(["Bearer test-token"])).toBe("test-token");
    });
  });

  describe("extractApiKey", () => {
    it("should extract API key from Authorization header", () => {
      const req = {
        headers: {
          authorization: "Bearer test-api-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("test-api-key");
    });

    it("should extract API key from ContextEngine-API-Key header", () => {
      const req = {
        headers: {
          "ContextEngine-API-Key": "test-api-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("test-api-key");
    });

    it("should extract API key from context-engine-api-key header", () => {
      const req = {
        headers: {
          "context-engine-api-key": "test-api-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("test-api-key");
    });

    it("should extract API key from X-API-Key header", () => {
      const req = {
        headers: {
          "X-API-Key": "test-api-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("test-api-key");
    });

    it("should extract API key from x-api-key header", () => {
      const req = {
        headers: {
          "x-api-key": "test-api-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("test-api-key");
    });

    it("should return undefined when no API key headers present", () => {
      const req = {
        headers: {},
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBeUndefined();
    });

    it("should prioritize Authorization header over others", () => {
      const req = {
        headers: {
          authorization: "Bearer auth-key",
          "ContextEngine-API-Key": "context-key",
          "X-API-Key": "x-key",
        },
      } as unknown as IncomingMessage;

      expect(extractApiKey(req)).toBe("auth-key");
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from X-Forwarded-For header", () => {
      const req = {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("should extract IP from X-Forwarded-For header with mixed case", () => {
      const req = {
        headers: {
          "X-Forwarded-For": "203.0.113.1, 192.168.1.1",
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("203.0.113.1");
    });

    it("should return first public IP from X-Forwarded-For", () => {
      const req = {
        headers: {
          "x-forwarded-for": "10.0.0.1, 192.168.1.1, 203.0.113.1",
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("203.0.113.1");
    });

    it("should return first IP if all are private", () => {
      const req = {
        headers: {
          "x-forwarded-for": "10.0.0.1, 192.168.1.1",
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("should handle IPv6-mapped IPv4 addresses", () => {
      const req = {
        headers: {
          "x-forwarded-for": "::ffff:192.168.1.1",
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("should fallback to socket remote address", () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: "::ffff:192.168.1.2",
        },
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("192.168.1.2");
    });

    it("should return undefined when no IP information available", () => {
      const req = {
        headers: {},
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBeUndefined();
    });

    it("should handle array format of X-Forwarded-For", () => {
      const req = {
        headers: {
          "x-forwarded-for": ["192.168.1.1, 10.0.0.1"],
        },
        socket: {},
      } as unknown as IncomingMessage;

      expect(getClientIp(req)).toBe("192.168.1.1");
    });
  });

  describe("setupCorsHeaders", () => {
    it("should set all required CORS headers", () => {
      const { res } = createMockResponse();

      setupCorsHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS,DELETE"
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-ContextEngine-API-Key, ContextEngine-API-Key, X-API-Key, Authorization"
      );
      expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Expose-Headers", "MCP-Session-Id");
    });
  });

  describe("sendErrorResponse", () => {
    it("should send error response with status code and message", () => {
      const { res } = createMockResponse();
      const statusCode = 404;
      const message = "Not found";

      sendErrorResponse(res, statusCode, message);

      expect(res.writeHead).toHaveBeenCalledWith(statusCode);
      expect(res.end).toHaveBeenCalledWith(message);
    });
  });

  describe("handlePreflightRequest", () => {
    it("should send 200 response for OPTIONS request", () => {
      const { res } = createMockResponse();

      handlePreflightRequest(res);

      expect(res.writeHead).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });
  });
});
