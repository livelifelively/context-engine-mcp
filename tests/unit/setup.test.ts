import { describe, it, expect } from 'vitest';
import apiResponses from '../fixtures/api-responses.json';
import mcpRequests from '../fixtures/mcp-requests.json';

describe('Test Setup', () => {
  it('should have access to test fixtures', () => {
    expect(apiResponses).toBeDefined();
    expect(apiResponses.health).toBeDefined();
    expect(apiResponses.greet).toBeDefined();
    
    expect(mcpRequests).toBeDefined();
    expect(mcpRequests.initialize).toBeDefined();
    expect(mcpRequests.toolsList).toBeDefined();
  });

  it('should have proper health response structure', () => {
    const healthResponse = apiResponses.health.success;
    expect(healthResponse).toHaveProperty('status');
    expect(healthResponse).toHaveProperty('timestamp');
    expect(healthResponse).toHaveProperty('version');
    expect(healthResponse.status).toBe('healthy');
  });

  it('should have proper MCP request structure', () => {
    const initRequest = mcpRequests.initialize.request;
    expect(initRequest).toHaveProperty('jsonrpc');
    expect(initRequest).toHaveProperty('id');
    expect(initRequest).toHaveProperty('method');
    expect(initRequest).toHaveProperty('params');
    expect(initRequest.jsonrpc).toBe('2.0');
    expect(initRequest.method).toBe('initialize');
  });

  it('should have proper MCP response structure', () => {
    const initResponse = mcpRequests.initialize.response;
    expect(initResponse).toHaveProperty('jsonrpc');
    expect(initResponse).toHaveProperty('id');
    expect(initResponse).toHaveProperty('result');
    expect(initResponse.jsonrpc).toBe('2.0');
    expect(initResponse.result).toHaveProperty('protocolVersion');
    expect(initResponse.result).toHaveProperty('serverInfo');
  });
});
