interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export function createLogger(component: string): Logger {
  const prefix = `[${component}]`;
  const isDev = import.meta.env.DEV;

  return {
    debug(message: string, ...args: unknown[]) {
      if (isDev) console.debug(prefix, message, ...args);
    },
    info(message: string, ...args: unknown[]) {
      if (isDev) console.info(prefix, message, ...args);
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(prefix, message, ...args);
    },
    error(message: string, ...args: unknown[]) {
      console.error(prefix, message, ...args);
    },
  };
}
