/**
 * MCP-Compatible Logger
 *
 * A logger specifically designed for MCP servers that:
 * - Writes all output to stderr to avoid breaking stdio protocol
 * - Provides different log levels
 * - Can be controlled via environment variables
 * - Maintains JSON structure for structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

// Type for log context - allows common types while maintaining type safety
type LogContext = Record<
  string,
  string | number | boolean | null | undefined | Record<string, unknown>
>;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
}

class MCPLogger {
  private level: LogLevel;
  private isStructured: boolean;

  constructor() {
    // Get log level from environment or default to INFO
    const envLevel = process.env.MCP_LOG_LEVEL?.toUpperCase();
    this.level = envLevel
      ? (LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO)
      : LogLevel.INFO;

    // Enable structured logging if requested
    this.isStructured = process.env.MCP_STRUCTURED_LOGS === "true";
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    if (this.isStructured) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(context && { context }),
      };
      return JSON.stringify(entry);
    }

    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private write(level: LogLevel, levelName: string, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(levelName, message, context);
    // Always write to stderr to avoid breaking MCP stdio protocol
    process.stderr.write(formatted + "\n");
  }

  error(message: string, context?: LogContext): void {
    this.write(LogLevel.ERROR, "error", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write(LogLevel.WARN, "warn", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write(LogLevel.INFO, "info", message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.write(LogLevel.DEBUG, "debug", message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.write(LogLevel.TRACE, "trace", message, context);
  }

  // Convenience method for API-related logging
  api(message: string, context?: LogContext): void {
    this.info(`[API] ${message}`, context);
  }

  // Convenience method for MCP-related logging
  mcp(message: string, context?: LogContext): void {
    this.info(`[MCP] ${message}`, context);
  }
}

// Export singleton instance
export const logger = new MCPLogger();

// Export the class for testing
export { MCPLogger };
