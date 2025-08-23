import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkHealth, greet, searchLibraries, fetchLibraryDocumentation } from '../../src/lib/api.js';
import apiResponses from '../fixtures/api-responses.json';

// Create a mock fetch function
const mockFetch = vi.fn();

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub global fetch for each test
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('checkHealth', () => {
    it('should return health status on successful API call', async () => {
      const mockResponse = apiResponses.health.success;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkHealth();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'X-ContextEngine-Source': 'mcp-server',
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/health');
    });

    it('should return error message on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkHealth();

      expect(result).toBe('Health check failed: Error: Network error');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return error message on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await checkHealth();

      expect(result).toBe('Health check failed: Error: The library you are trying to access does not exist. Please try with a different library ID.');
    });

    it('should return error message on rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await checkHealth();

      expect(result).toBe('Health check failed: Error: Rate limited due to too many requests. Please try again later.');
    });

    it('should return error message on unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await checkHealth();

      expect(result).toBe('Health check failed: Error: Unauthorized. Please check your API key.');
    });

    it('should use custom server URL when provided', async () => {
      const customUrl = 'https://custom-api.example.com';
      const mockResponse = apiResponses.health.success;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await checkHealth(undefined, undefined, customUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'X-ContextEngine-Source': 'mcp-server',
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://custom-api.example.com/api/v1/health');
    });

    it('should include client IP and API key in headers when provided', async () => {
      const mockResponse = apiResponses.health.success;
      const clientIp = '192.168.1.1';
      const apiKey = 'test-api-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await checkHealth(clientIp, apiKey);

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
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/health');
    });
  });

  describe('greet', () => {
    it('should return greeting message on successful API call', async () => {
      const mockResponse = apiResponses.greet.success;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse,
      });

      const result = await greet();

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'X-ContextEngine-Source': 'mcp-server',
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/greet');
    });

    it('should return greeting with name when provided', async () => {
      const mockResponse = apiResponses.greet.withName;
      const name = 'Alice';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse,
      });

      const result = await greet(name);

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'X-ContextEngine-Source': 'mcp-server',
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/greet?name=Alice');
    });

    it('should return error message on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await greet();

      expect(result).toBe('Greeting failed: Error: Network error');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return error message on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await greet();

      expect(result).toBe('Greeting failed: Error: The library you are trying to access does not exist. Please try with a different library ID.');
    });

    it('should return fallback message when API returns empty content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'No content available',
      });

      const result = await greet();

      expect(result).toBe('Hello! API is working but no greeting content available.');
    });

    it('should return actual text when API returns "No context data available"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'No context data available',
      });

      const result = await greet();

      expect(result).toBe('No context data available');
    });

    it('should use custom server URL when provided', async () => {
      const customUrl = 'https://custom-api.example.com';
      const mockResponse = apiResponses.greet.success;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse,
      });

      await greet(undefined, undefined, undefined, customUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        {
          headers: {
            'X-ContextEngine-Source': 'mcp-server',
          },
        }
      );
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://custom-api.example.com/api/v1/greet');
    });

    it('should include client IP and API key in headers when provided', async () => {
      const mockResponse = apiResponses.greet.success;
      const clientIp = '192.168.1.1';
      const apiKey = 'test-api-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse,
      });

      await greet(undefined, clientIp, apiKey);

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
      expect(mockFetch.mock.calls[0][0].toString()).toBe('https://contextengine.in/api/v1/greet');
    });
  });

  describe('searchLibraries', () => {
    it('should return search results on successful API call', async () => {
      const mockResponse = {
        results: [
          {
            id: 'react',
            title: 'React',
            description: 'A JavaScript library for building user interfaces',
            url: 'https://reactjs.org',
            score: 0.95
          }
        ],
        total: 1,
        page: 1,
        hasMore: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await searchLibraries('react');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
    });

    it('should handle search API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await searchLibraries('test');
      expect(result.results).toEqual([]);
      expect(result.error).toContain('Error searching libraries');
    });

    it('should include query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], total: 0, page: 1, hasMore: false })
      });

      await searchLibraries('typescript', '192.168.1.1', 'api-key', 'https://custom.com');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0];
      expect(url.toString()).toContain('typescript');
    });
  });

  describe('fetchLibraryDocumentation', () => {
    it('should return documentation text on successful API call', async () => {
      const mockDocumentation = 'This is the documentation for the library.';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockDocumentation)
      });

      const result = await fetchLibraryDocumentation('react');
      expect(result).toBe(mockDocumentation);
    });

    it('should handle documentation API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await fetchLibraryDocumentation('nonexistent');
      expect(result).toContain('Error fetching library documentation');
    });

    it('should return null for empty content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('No content available')
      });

      const result = await fetchLibraryDocumentation('empty');
      expect(result).toBeNull();
    });

    it('should return null for no context data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('No context data available')
      });

      const result = await fetchLibraryDocumentation('empty');
      expect(result).toBeNull();
    });

    it('should handle library ID with leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Documentation')
      });

      const result = await fetchLibraryDocumentation('/react');
      expect(result).toBe('Documentation');
    });

    it('should include options in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Documentation with options')
      });

      await fetchLibraryDocumentation('library', { tokens: 1000, topic: 'hooks' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0];
      expect(url.toString()).toContain('tokens=1000');
      expect(url.toString()).toContain('topic=hooks');
    });
  });
});
