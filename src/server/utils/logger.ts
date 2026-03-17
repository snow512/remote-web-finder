type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const meta = entry.meta ? ' ' + JSON.stringify(entry.meta) : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${meta}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  const formatted = formatEntry(entry);
  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    log('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    log('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>): void {
    log('error', message, meta);
  },
  request(method: string, path: string, status: number, durationMs: number): void {
    if (process.env.NODE_ENV === 'test') return;
    log('info', `${method} ${path} ${status} ${durationMs}ms`);
  },
};
