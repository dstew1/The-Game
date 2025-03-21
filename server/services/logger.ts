// Custom logger implementation with error tracking and structured output

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: number;
  path?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(entry: LogEntry): string {
    const base = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`;
    const context = [
      entry.requestId ? `requestId=${entry.requestId}` : null,
      entry.userId ? `userId=${entry.userId}` : null,
      entry.path ? `path=${entry.path}` : null,
    ].filter(Boolean).join(' ');

    let result = base + (context ? ` (${context})` : '');

    if (entry.error) {
      result += `\nError: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        result += `\nStack trace:\n${entry.error.stack}`;
      }
    }

    if (entry.metadata) {
      result += `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    return result;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(metadata && { metadata }),
    };
  }

  info(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, undefined, metadata);
    console.log(this.formatLog(entry));
  }

  warn(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, undefined, metadata);
    console.warn(this.formatLog(entry));
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, error, metadata);
    console.error(this.formatLog(entry));
  }
}

export const logger = Logger.getInstance();
