import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock fetch globally for all tests
global.fetch = vi.fn();

// Setup MSW server for API mocking with comprehensive scenarios
export const server = setupServer(
  // Default health endpoint mock
  http.get('https://contextengine.in/api/v1/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0'
    });
  }),

  // Default greet endpoint mock
  http.get('https://contextengine.in/api/v1/greet', () => {
    return HttpResponse.json('Hello! API is working correctly.');
  }),

  // Greet endpoint with query params mock
  http.get('https://contextengine.in/api/v1/greet*', ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    return HttpResponse.json(`Hello, ${name || 'there'}! API is working correctly.`);
  }),

  // Fallback for any unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );
  })
);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Reset handlers between tests
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
