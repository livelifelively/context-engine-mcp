# Test Mocks

This directory contains mock configurations for testing.

## Structure

### `api-mocks.ts`
- **Purpose**: MSW (Mock Service Worker) setup for API mocking
- **Features**:
  - Conditional mocking based on `TEST_MODE`
  - Mock responses for all API endpoints
  - Fallback handlers for unmatched requests
  - Clean lifecycle management (start/stop/reset)

### `fixtures/`
- **Purpose**: Static mock data and responses
- **Files**:
  - `api-responses.json`: Mock API response data

## Usage

### Mock Mode (Default)
```bash
npm run test:mock
# Uses MSW to mock all API calls
```

### Real API Mode
```bash
npm run test:real
# Skips MSW, makes real API calls
```

### Local Development
```bash
npm run test:local
# Skips MSW, calls local development server
```

## Configuration

Mocks are controlled by the `TEST_MODE` environment variable:
- `mock`: Uses MSW for all API calls
- `real`: Skips MSW, uses real API
- `integration`: Skips MSW, uses real API (same as real)

## Adding New Mocks

1. Add new handlers to `api-mocks.ts`
2. Add corresponding fixtures to `fixtures/`
3. Update tests to use the new mocks
