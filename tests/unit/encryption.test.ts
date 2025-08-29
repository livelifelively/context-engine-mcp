import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateHeaders } from "../../src/lib/encryption.js";

// Mock crypto module with proper implementation
const mockCipher = {
  update: vi.fn((_data: string, _inputEncoding: string, _outputEncoding: string) => {
    return "encrypted-data";
  }),
  final: vi.fn((_outputEncoding: string) => {
    return "final-encrypted";
  }),
};

vi.mock("crypto", () => ({
  createCipheriv: vi.fn(() => mockCipher),
  randomBytes: vi.fn(() => Buffer.from("test-iv-16-bytes")),
}));

describe("Encryption Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateHeaders", () => {
    it("should return empty headers when no parameters provided", () => {
      const headers = generateHeaders();

      expect(headers).toEqual({});
    });

    it("should include client IP when provided", () => {
      const clientIp = "192.168.1.1";
      const headers = generateHeaders(clientIp);

      expect(headers).toHaveProperty("mcp-client-ip");
      expect(headers["mcp-client-ip"]).toBeDefined();
      expect(typeof headers["mcp-client-ip"]).toBe("string");
    });

    it("should include Authorization header when API key provided", () => {
      const apiKey = "test-api-key";
      const headers = generateHeaders(undefined, apiKey);

      expect(headers).toHaveProperty("Authorization");
      expect(headers["Authorization"]).toBe("Bearer test-api-key");
    });

    it("should include both client IP and API key when both provided", () => {
      const clientIp = "192.168.1.1";
      const apiKey = "test-api-key";
      const headers = generateHeaders(clientIp, apiKey);

      expect(headers).toHaveProperty("mcp-client-ip");
      expect(headers).toHaveProperty("Authorization");
      expect(headers["Authorization"]).toBe("Bearer test-api-key");
      expect(typeof headers["mcp-client-ip"]).toBe("string");
    });

    it("should include extra headers when provided", () => {
      const extraHeaders = {
        "X-Custom-Header": "custom-value",
        "Content-Type": "application/json",
      };
      const headers = generateHeaders(undefined, undefined, extraHeaders);

      expect(headers).toHaveProperty("X-Custom-Header");
      expect(headers).toHaveProperty("Content-Type");
      expect(headers["X-Custom-Header"]).toBe("custom-value");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should combine all headers when all parameters provided", () => {
      const clientIp = "192.168.1.1";
      const apiKey = "test-api-key";
      const extraHeaders = {
        "X-Custom-Header": "custom-value",
      };
      const headers = generateHeaders(clientIp, apiKey, extraHeaders);

      expect(headers).toHaveProperty("mcp-client-ip");
      expect(headers).toHaveProperty("Authorization");
      expect(headers).toHaveProperty("X-Custom-Header");
      expect(headers["Authorization"]).toBe("Bearer test-api-key");
      expect(headers["X-Custom-Header"]).toBe("custom-value");
      expect(typeof headers["mcp-client-ip"]).toBe("string");
    });

    it("should not override extra headers with built-in headers", () => {
      const extraHeaders = {
        Authorization: "Custom-Auth custom-value",
        "mcp-client-ip": "custom-ip",
      };
      const clientIp = "192.168.1.1";
      const apiKey = "test-api-key";
      const headers = generateHeaders(clientIp, apiKey, extraHeaders);

      // Built-in headers should take precedence
      expect(headers["Authorization"]).toBe("Bearer test-api-key");
      expect(headers["mcp-client-ip"]).not.toBe("custom-ip");
      expect(typeof headers["mcp-client-ip"]).toBe("string");
    });

    it("should handle empty string client IP", () => {
      const headers = generateHeaders("");

      expect(headers).toEqual({});
    });

    it("should handle empty string API key", () => {
      const headers = generateHeaders(undefined, "");

      expect(headers).toEqual({});
    });

    it("should handle null and undefined values gracefully", () => {
      const headers1 = generateHeaders(null as any, null as any);
      const headers2 = generateHeaders(undefined, undefined);

      expect(headers1).toEqual({});
      expect(headers2).toEqual({});
    });
  });
});
