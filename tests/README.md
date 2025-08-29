# Test Configuration Guide

This directory contains the test suite for the Context Engine MCP Server with configurable API endpoints and test modes.

## Test Configuration

The tests can be configured using environment variables to test against different environments:

### Environment Variables

- `TEST_MODE`: Test mode (`mock`, `real`, `integration`)
- `TEST_API_BASE_URL`: API base URL for testing
- `TEST_TIMEOUT`: Test timeout in milliseconds
- `TEST_API_KEY`: API key for authenticated tests
- `TEST_RETRIES`: Number of retries for failed tests

### Test Modes

- **`mock`**: Uses mocked responses (fast, no network calls)
- **`real`**: Makes actual API calls to configured endpoint
- **`integration`**: Full integration testing with real API

## Usage Examples

### Test with Mock Data (Fast)
```bash
npm run test:mock
```

### Test with Real API (Default)
```bash
npm run test:real
```

### Test against Local Development Server
```bash
npm run test:local
```

### Test against Production API
```bash
npm run test:prod
```

### Test Specific Files

You can run specific test files by passing them as arguments to any test script:

```bash
# Test specific file with mock mode
npm run test:mock -- tests/integration/mcp-server.test.ts

# Test specific file against local server
npm run test:local -- tests/integration/mcp-server.test.ts

# Test specific file against production
npm run test:prod -- tests/unit/api.test.ts

# Test multiple specific files
npm run test:local -- tests/integration/mcp-server.test.ts tests/unit/api.test.ts

# Alternative: Use vitest directly with environment variables
TEST_MODE=real TEST_API_BASE_URL=http://localhost:3000 npx vitest run tests/integration/mcp-server.test.ts
```

### Debug and Development

```bash
# Debug mode with verbose output and longer timeout
npm run test:debug

# Watch mode for local development
npm run test:watch:local

# Debug specific file
npm run test:debug -- tests/integration/mcp-server.test.ts
```

### Custom Configuration
```bash
TEST_MODE=real TEST_API_BASE_URL=http://localhost:3000 npm test
```

## MCP Client Configuration

The MCP client is automatically configured with the same arguments that would be used in production:

- Server URL from `TEST_API_BASE_URL`
- API key from `TEST_API_KEY`
- Transport type: stdio

This ensures that integration tests validate the actual end-to-end flow that users will experience.

## Test Structure

- `config/test-config.ts`: Test configuration management
- `utils/mcp-test-utils.ts`: MCP client utilities and validation
- `integration/mcp-server.test.ts`: Integration tests
- `unit/`: Unit tests for individual modules

## Debugging

To debug test issues:

1. Check the console output for configuration details
2. Verify API connectivity with the configured endpoint
3. Review MCP server arguments in the logs
4. Check for error messages in tool responses
