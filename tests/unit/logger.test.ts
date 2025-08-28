import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPLogger, LogLevel } from '../../src/lib/logger.js';

describe('MCPLogger', () => {
  let logger: MCPLogger;
  let stderrSpy: any;

  beforeEach(() => {
    // Spy on stderr.write instead of replacing it
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    
    // Create fresh logger instance
    logger = new MCPLogger();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Log Levels', () => {
    it('should respect log level configuration', () => {
      // Set to INFO level
      vi.stubEnv('MCP_LOG_LEVEL', 'INFO');
      const infoLogger = new MCPLogger();
      
      infoLogger.debug('debug message'); // Should not log
      infoLogger.info('info message');   // Should log
      infoLogger.warn('warn message');   // Should log
      infoLogger.error('error message'); // Should log
      
      expect(stderrSpy).toHaveBeenCalledTimes(3);
      expect(stderrSpy).not.toHaveBeenCalledWith(expect.stringContaining('debug message'));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('info message'));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('warn message'));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should default to INFO level when no environment variable is set', () => {
      vi.unstubAllEnvs();
      const defaultLogger = new MCPLogger();
      
      defaultLogger.debug('debug message'); // Should not log
      defaultLogger.info('info message');   // Should log
      
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).not.toHaveBeenCalledWith(expect.stringContaining('debug message'));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('info message'));
    });
  });

  describe('Output Format', () => {
    it('should write to stderr (not stdout)', () => {
      logger.info('test message');
      
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
    });

    it('should include timestamp in output', () => {
      logger.info('test message');
      
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should include log level in output', () => {
      logger.info('test message');
      
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('INFO: test message');
    });
  });

  describe('Structured Logging', () => {
    it('should output JSON when structured logging is enabled', () => {
      vi.stubEnv('MCP_STRUCTURED_LOGS', 'true');
      const structuredLogger = new MCPLogger();
      
      structuredLogger.info('test message', { key: 'value' });
      
      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      
      expect(parsed).toMatchObject({
        timestamp: expect.any(String),
        level: 'info',
        message: 'test message',
        context: { key: 'value' }
      });
    });

    it('should output plain text when structured logging is disabled', () => {
      vi.stubEnv('MCP_STRUCTURED_LOGS', 'false');
      const plainLogger = new MCPLogger();
      
      plainLogger.info('test message', { key: 'value' });
      
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('INFO: test message');
      expect(output).toContain('{"key":"value"}');
      expect(() => JSON.parse(output)).toThrow(); // Should not be valid JSON
    });
  });

  describe('Convenience Methods', () => {
    it('should prefix API messages correctly', () => {
      logger.api('API call made', { endpoint: '/test' });
      
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('[API] API call made');
    });

    it('should prefix MCP messages correctly', () => {
      logger.mcp('Tool called', { tool: 'greet' });
      
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('[MCP] Tool called');
    });
  });
});
