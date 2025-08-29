import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startContextEngine } from '../../src/lib/api.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load JSON fixtures
const apiResponses = JSON.parse(readFileSync(join(__dirname, '../fixtures/api-responses.json'), 'utf8'));
import { getTestConfig, shouldUseRealApi } from '../config/test-config.js';

// Create a mock fetch function
const mockFetch = vi.fn();

describe('API Functions', () => {
  const config = getTestConfig();

  beforeEach(() => {
    vi.clearAllMocks();
    
    if (shouldUseRealApi()) {
      // For real API tests, don't mock fetch - let it use real fetch
    } else {
      // For mock tests, stub global fetch
      vi.stubGlobal('fetch', mockFetch);
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });





  describe('startContextEngine', () => {
    it('should return success message on successful API call', async () => {
      const mockResponse = apiResponses['start-context-engine'].success;
      
      if (!shouldUseRealApi()) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockResponse,
        });
      }

      const result = await startContextEngine(undefined, undefined, config.apiBaseUrl);

      // Same expectations regardless of mock or real
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Context engine started');
      expect(result).not.toContain('Failed to start context engine');
      
      if (!shouldUseRealApi()) {
        // Additional mock-specific validations
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(URL),
          {
            headers: {
              'X-ContextEngine-Source': 'mcp-server',
            },
          }
        );
        expect(mockFetch.mock.calls[0][0].toString()).toBe(`${config.apiBaseUrl}/api/start-context-engine`);
      }
    });

    it('should return fallback message when API returns empty content', async () => {
      if (shouldUseRealApi()) {
        // Skip this test for real API - we can't control API responses
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'No content available',
      });

      const result = await startContextEngine();

      expect(result).toBe('Context engine start request sent but no confirmation available.');
    });

    it('should throw error on network failure', async () => {
      if (shouldUseRealApi()) {
        // Skip network failure test for real API - we can't control network
        return;
      }
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(startContextEngine()).rejects.toThrow('Failed to start context engine: Error: Network error');
    });

    it('should throw error on API error response', async () => {
      if (shouldUseRealApi()) {
        // Skip API error test for real API - we can't control API responses
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(startContextEngine()).rejects.toThrow('Failed to start context engine: Error: Failed to start context engine. Please try again later. Error code: 500');
    });

    it('should use custom server URL when provided', async () => {
      const customUrl = 'https://custom-api.example.com';
      const mockResponse = apiResponses['start-context-engine'].success;
      
      if (!shouldUseRealApi()) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockResponse,
        });
      }

      const result = await startContextEngine(undefined, undefined, customUrl);

      // Same expectations regardless of mock or real
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Context engine started');
      expect(result).not.toContain('Failed to start context engine');
      
      if (!shouldUseRealApi()) {
        // Additional mock-specific validations
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(URL),
          {
            headers: {
              'X-ContextEngine-Source': 'mcp-server',
            },
          }
        );
        expect(mockFetch.mock.calls[0][0].toString()).toBe(`${customUrl}/api/start-context-engine`);
      }
    });

    it('should include client IP and API key in headers when provided', async () => {
      if (shouldUseRealApi()) {
        // Skip this test for real API - we can't control API responses
        return;
      }
      
      const mockResponse = apiResponses['start-context-engine'].success;
      const clientIp = '192.168.1.1';
      const apiKey = 'test-api-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse,
      });

      await startContextEngine(clientIp, apiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'X-ContextEngine-Source': 'mcp-server',
            'mcp-client-ip': expect.any(String),
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/start-context-engine');
    });
  });
});
