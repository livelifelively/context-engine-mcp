# Test Utilities

This directory contains reusable test utilities for the ContextEngine MCP project.

## MCPTestUtils

The `MCPTestUtils` class provides utilities for MCP integration testing.

### Usage

```typescript
import { MCPTestUtils } from '../utils/mcp-test-utils.js';

describe('My MCP Tests', () => {
  beforeAll(async () => {
    await MCPTestUtils.setupClient();
  });

  afterAll(async () => {
    await MCPTestUtils.cleanupClient();
  });

  it('should test MCP functionality', async () => {
    if (MCPTestUtils.skipIfNotConnected('my test')) return;
    
    // Call a tool and validate the result
    await MCPTestUtils.callToolAndValidate('check-health');
    
    // Test error scenarios
    await MCPTestUtils.expectToolError('invalid-tool');
    
    // Validate available tools
    await MCPTestUtils.validateAvailableTools(['check-health', 'greet']);
    
    // Validate tool schemas
    await MCPTestUtils.validateToolSchema('check-health');
  });
});
```

### Available Methods

- `setupClient()` - Sets up MCP client and connects to server
- `cleanupClient()` - Cleans up client connection
- `skipIfNotConnected(testName)` - Skips test if not connected
- `validateToolResult(result)` - Validates tool result structure
- `callToolAndValidate(name, args)` - Calls tool and validates result
- `expectToolError(name, args)` - Expects tool call to throw error
- `createTransport()` - Creates StdioClientTransport instance
- `getTools()` - Gets list of available tools
- `validateAvailableTools(expectedTools)` - Validates specific tools exist
- `validateToolSchema(toolName)` - Validates tool schema structure

### Benefits

- **Reusability**: Use across multiple test files
- **Consistency**: Standardized MCP testing patterns
- **Maintainability**: Centralized MCP client logic
- **Readability**: Clean, focused test cases

## APIMockUtils

The `APIMockUtils` class provides utilities for API mocking scenarios using MSW.

### Usage

```typescript
import { APIMockUtils } from '../utils/api-mock-utils.js';

describe('API Mocking Tests', () => {
  beforeEach(() => {
    APIMockUtils.resetMocks();
  });

  it('should test successful API responses', async () => {
    APIMockUtils.mockSuccessfulHealth('healthy', '1.0.0');
    APIMockUtils.mockSuccessfulGreet('Hello, User!');
    
    // Test your MCP tools here
  });

  it('should test error scenarios', async () => {
    APIMockUtils.mockNetworkError();
    APIMockUtils.mockAuthError();
    APIMockUtils.mockRateLimitError();
    
    // Test error handling
  });
});
```

### Available Methods

- `mockSuccessfulHealth(status, version)` - Mock successful health response
- `mockSuccessfulGreet(message)` - Mock successful greet response
- `mockNetworkError()` - Mock network connection error
- `mockHttpError(status, message)` - Mock HTTP error response
- `mockAuthError()` - Mock authentication error (401)
- `mockRateLimitError()` - Mock rate limit error (429)
- `mockServerError()` - Mock server error (500)
- `mockAuthScenario(validApiKey)` - Mock API key validation
- `mockClientIPScenario(validClientIP)` - Mock client IP validation
- `mockMalformedResponse()` - Mock malformed JSON response
- `mockEmptyResponse()` - Mock empty response
- `mockSlowResponse(delayMs)` - Mock slow response (timeout simulation)
- `mockLargeResponse(size)` - Mock large response payload
- `mockProductionResponse()` - Mock production-like responses
- `mockAPIVersioning()` - Mock API versioning scenarios
- `mockCustomServerURL(baseURL)` - Mock custom server URL
- `resetMocks()` - Reset all mock handlers
- `getServer()` - Get MSW server instance

### Benefits

- **Realistic Testing**: Test with realistic API scenarios
- **Error Coverage**: Comprehensive error condition testing
- **Maintainability**: Centralized mock configuration
- **Flexibility**: Easy to customize mock responses
