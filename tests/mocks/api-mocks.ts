import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { shouldUseRealApi } from '../config/test-config.js';

// Setup MSW server for API mocking with comprehensive scenarios
export const apiServer = setupServer(
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

/**
 * Start the API mock server if in mock mode
 */
export function startApiMocks() {
  if (!shouldUseRealApi()) {
    apiServer.listen({ onUnhandledRequest: 'error' });
  }
}

/**
 * Stop the API mock server if in mock mode
 */
export function stopApiMocks() {
  if (!shouldUseRealApi()) {
    apiServer.close();
  }
}

/**
 * Reset API mock handlers if in mock mode
 */
export function resetApiMocks() {
  if (!shouldUseRealApi()) {
    apiServer.resetHandlers();
  }
}
