import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestUtils } from '../utils/mcp-test-utils.js';

describe('MCP Server Integration', () => {
  beforeAll(async () => {
    await MCPTestUtils.setupClient();
  });

  afterAll(async () => {
    await MCPTestUtils.cleanupClient();
  });

  it('should execute greet tool and return valid response', async () => {
    if (MCPTestUtils.skipIfNotConnected('greet test')) return;
    
    // This test calls the local MCP server, which then calls the configured API
    // Flow: Test → MCP Client → Local MCP Server → API (local or remote)
    const result = await MCPTestUtils.client.callTool({ 
      name: 'greet', 
      arguments: { name: 'TestUser' } 
    });
    
    const content = result.content as any[];
    const responseText = content[0].text;
    console.log('MCP Tool Response:', responseText);
    
    // Strong assertions - should NOT be an error
    expect(responseText).toBeDefined();
    expect(typeof responseText).toBe('string');
    expect(responseText).not.toContain('Failed to send greeting');
    expect(responseText).not.toContain('library you are trying to access does not exist');
    
    // Should be a proper greeting
    expect(responseText).toContain('Hello');
    expect(responseText).toContain('TestUser');
  });
});
