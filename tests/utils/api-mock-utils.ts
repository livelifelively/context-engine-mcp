import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';

/**
 * API Mock Utilities for Phase 5 testing
 * 
 * Provides reusable mock scenarios for testing realistic API responses,
 * error conditions, and edge cases.
 */

export class APIMockUtils {
  /**
   * Mock successful health response
   */
  static mockSuccessfulHealth(status = 'healthy', version = '1.0.0') {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.json({
          status,
          timestamp: new Date().toISOString(),
          version
        });
      })
    );
  }

  /**
   * Mock successful greet response
   */
  static mockSuccessfulGreet(message?: string) {
    server.use(
      http.get('https://contextengine.in/api/v1/greet*', ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get('name');
        const response = message || `Hello, ${name || 'there'}! API is working correctly.`;
        return HttpResponse.json(response);
      })
    );
  }

  /**
   * Mock network error
   */
  static mockNetworkError() {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.error();
      })
    );
  }

  /**
   * Mock HTTP error response
   */
  static mockHttpError(status: number, message: string) {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.json(
          { error: message },
          { status }
        );
      })
    );
  }

  /**
   * Mock authentication error
   */
  static mockAuthError() {
    return this.mockHttpError(401, 'Unauthorized. Please check your API key.');
  }

  /**
   * Mock rate limit error
   */
  static mockRateLimitError() {
    return this.mockHttpError(429, 'Rate limited due to too many requests. Please try again later.');
  }

  /**
   * Mock server error
   */
  static mockServerError() {
    return this.mockHttpError(500, 'Internal server error');
  }

  /**
   * Mock authentication scenario with API key validation
   */
  static mockAuthScenario(validApiKey: string) {
    server.use(
      http.get('https://contextengine.in/api/v1/health', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (authHeader === `Bearer ${validApiKey}`) {
          return HttpResponse.json({
            status: 'authenticated',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          });
        } else {
          return HttpResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }
      })
    );
  }

  /**
   * Mock client IP validation scenario
   */
  static mockClientIPScenario(validClientIP: string) {
    server.use(
      http.get('https://contextengine.in/api/v1/health', ({ request }) => {
        const clientIp = request.headers.get('X-Client-IP');
        if (clientIp === validClientIP) {
          return HttpResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            clientIp: validClientIP
          });
        } else {
          return HttpResponse.json(
            { error: 'Invalid client IP' },
            { status: 403 }
          );
        }
      })
    );
  }

  /**
   * Mock malformed JSON response
   */
  static mockMalformedResponse() {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return new HttpResponse('{ invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  }

  /**
   * Mock empty response
   */
  static mockEmptyResponse() {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.json('');
      })
    );
  }

  /**
   * Mock slow response (simulate timeout)
   */
  static mockSlowResponse(delayMs = 50) {
    server.use(
      http.get('https://contextengine.in/api/v1/health', async () => {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return HttpResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      })
    );
  }

  /**
   * Mock large response payload
   */
  static mockLargeResponse(size = 1000) {
    const largePayload = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: Array(size).fill('test').join('')
    };

    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.json(largePayload);
      })
    );
  }

  /**
   * Mock production-like response
   */
  static mockProductionResponse() {
    server.use(
      http.get('https://contextengine.in/api/v1/health', () => {
        return HttpResponse.json({
          status: 'operational',
          timestamp: new Date().toISOString(),
          version: '1.0.13',
          uptime: 99.9,
          services: {
            database: 'healthy',
            cache: 'healthy',
            external_apis: 'healthy'
          }
        });
      }),
      http.get('https://contextengine.in/api/v1/greet*', ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get('name');
        return HttpResponse.json(
          name ? `Hello, ${name}! Welcome to ContextEngine.` : 'Hello! Welcome to ContextEngine.'
        );
      })
    );
  }

  /**
   * Mock API versioning scenario
   */
  static mockAPIVersioning() {
    server.use(
      http.get('https://contextengine.in/api/v1/health', ({ request }) => {
        const version = request.headers.get('X-API-Version');
        if (version === '2.0') {
          return HttpResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: ['enhanced_health', 'metrics']
          });
        } else {
          return HttpResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          });
        }
      })
    );
  }

  /**
   * Mock custom server URL scenario
   */
  static mockCustomServerURL(baseURL: string) {
    server.use(
      http.get(`${baseURL}/api/v1/health`, () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          server: baseURL
        });
      }),
      http.get(`${baseURL}/api/v1/greet*`, ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get('name');
        return HttpResponse.json(`Hello, ${name || 'there'}! from ${baseURL}`);
      })
    );
  }

  /**
   * Reset all mock handlers
   */
  static resetMocks() {
    server.resetHandlers();
  }

  /**
   * Get mock server instance for direct manipulation
   */
  static getServer() {
    return server;
  }
}
