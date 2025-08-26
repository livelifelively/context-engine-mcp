import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { greet } from '../../src/lib/api.js';
import apiResponses from '../fixtures/api-responses.json';
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



  describe('greet', () => {
    // it('should return greeting message on successful API call', async () => {
    //   const mockResponse = apiResponses.greet.success;
      
    //   if (!shouldUseRealApi()) {
    //     mockFetch.mockResolvedValueOnce({
    //       ok: true,
    //       text: async () => mockResponse,
    //     });
    //   }

    //   const result = await greet(undefined, undefined, undefined, config.apiBaseUrl);

    //   // Same expectations regardless of mock or real
    //   expect(result).toBeDefined();
    //   expect(typeof result).toBe('string');
    //   expect(result).toContain('Hello');
    //   expect(result).not.toContain('Failed to send greeting');
      
    //   if (!shouldUseRealApi()) {
    //     // Additional mock-specific validations
    //     expect(mockFetch).toHaveBeenCalledWith(
    //       expect.any(URL),
    //       {
    //         headers: {
    //           'X-ContextEngine-Source': 'mcp-server',
    //         },
    //       }
    //     );
    //     expect(mockFetch.mock.calls[0][0].toString()).toBe(`${config.apiBaseUrl}/api/greet`);
    //   }
    // });

    it('should return greeting with name when provided', async () => {
      const name = 'Alice';
      const mockResponse = apiResponses.greet.withName;
      
      if (!shouldUseRealApi()) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockResponse,
        });
      }

      const result = await greet(name, undefined, undefined, config.apiBaseUrl);

      // Same expectations regardless of mock or real
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Hello');
      expect(result).toContain(name);
      expect(result).not.toContain('Failed to send greeting');
      
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
        expect(mockFetch.mock.calls[0][0].toString()).toBe(`${config.apiBaseUrl}/api/greet?name=Alice`);
      }
    });

    // it('should throw error on network failure', async () => {
    //   if (shouldUseRealApi()) {
    //     // Skip network failure test for real API - we can't control network
    //     console.log('Skipping network failure test for real API');
    //     return;
    //   }
      
    //   mockFetch.mockRejectedValueOnce(new Error('Network error'));

    //   await expect(greet()).rejects.toThrow('Failed to send greeting: Error: Network error');
    //   expect(mockFetch).toHaveBeenCalledTimes(1);
    // });

    // it('should throw error on API error response', async () => {
    //   if (shouldUseRealApi()) {
    //     // Skip API error test for real API - we can't control API responses
    //     console.log('Skipping API error test for real API');
    //     return;
    //   }
      
    //   mockFetch.mockResolvedValueOnce({
    //     ok: false,
    //     status: 404,
    //   });

    //   await expect(greet()).rejects.toThrow('Failed to send greeting: Error: The library you are trying to access does not exist. Please try with a different library ID.');
    // });

    // it('should return fallback message when API returns empty content', async () => {
    //   if (shouldUseRealApi()) {
    //     // Skip this test for real API - we can't control API responses
    //     console.log('Skipping empty content test for real API');
    //     return;
    //   }
      
    //   mockFetch.mockResolvedValueOnce({
    //     ok: true,
    //     text: async () => 'No content available',
    //   });

    //   const result = await greet();

    //   expect(result).toBe('Hello! API is working but no greeting content available.');
    // });

    // it('should return actual text when API returns "No context data available"', async () => {
    //   if (shouldUseRealApi()) {
    //     // Skip this test for real API - we can't control API responses
    //     console.log('Skipping "No context data" test for real API');
    //     return;
    //   }
      
    //   mockFetch.mockResolvedValueOnce({
    //     ok: true,
    //     text: async () => 'No context data available',
    //   });

    //   const result = await greet();

    //   expect(result).toBe('No context data available');
    // });

    // it('should use custom server URL when provided', async () => {
    //   const customUrl = 'https://custom-api.example.com';
    //   const mockResponse = apiResponses.greet.success;
      
    //   if (!shouldUseRealApi()) {
    //     mockFetch.mockResolvedValueOnce({
    //       ok: true,
    //       text: async () => mockResponse,
    //     });
    //   }

    //   const result = await greet(undefined, undefined, undefined, customUrl);

    //   // Same expectations regardless of mock or real
    //   expect(result).toBeDefined();
    //   expect(typeof result).toBe('string');
    //   expect(result).toContain('Hello');
    //   expect(result).not.toContain('Failed to send greeting');
      
    //   if (!shouldUseRealApi()) {
    //     // Additional mock-specific validations
    //     expect(mockFetch).toHaveBeenCalledWith(
    //       expect.any(URL),
    //       {
    //         headers: {
    //           'X-ContextEngine-Source': 'mcp-server',
    //         },
    //       }
    //     );
    //     expect(mockFetch.mock.calls[0][0].toString()).toBe(`${customUrl}/api/greet`);
    //   }
    // });

    // it('should include client IP and API key in headers when provided', async () => {
    //   const mockResponse = apiResponses.greet.success;
    //   const clientIp = '192.168.1.1';
    //   const apiKey = 'test-api-key';
      
    //   mockFetch.mockResolvedValueOnce({
    //     ok: true,
    //     text: async () => mockResponse,
    //   });

    //   await greet(undefined, clientIp, apiKey);

    //   expect(mockFetch).toHaveBeenCalledWith(
    //     expect.any(URL),
    //     {
    //       headers: {
    //         'Authorization': 'Bearer test-api-key',
    //         'X-ContextEngine-Source': 'mcp-server',
    //         'mcp-client-ip': expect.any(String),
    //       },
    //     }
    //   );
    //   expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/greet');
    // });
  });
});
