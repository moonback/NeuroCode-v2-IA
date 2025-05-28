export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

type LoggerFunction = (...messages: any[]) => void;

interface Logger {
  trace: LoggerFunction;
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
  setLevel: (level: DebugLevel) => void;
}

// Fonction vide qui ne fait rien
const noop = (..._: any[]): void => {};

// Logger qui ne fait rien
export const logger: Logger = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  setLevel: noop,
};

// Crée un logger qui ne fait rien
export function createScopedLogger(_scope: string): Logger {
  return logger;
}

// Logger de rendu qui ne fait rien
export const renderLogger = logger;
