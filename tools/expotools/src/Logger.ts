import chalk, { Chalk } from 'chalk';
import readline from 'readline';

type LoggerResolver = (level: string, color: Chalk | null, args: any[]) => void;

const CONSOLE_RESOLVER = (level: string, color, args) => {
  return console[level](...(color ? args.map((arg) => color(arg)) : args));
};

/**
 * Basic logger just for simple console logging with colored output.
 */
export class Logger {
  readonly resolver: LoggerResolver;

  constructor(resolver: LoggerResolver = CONSOLE_RESOLVER) {
    this.resolver = resolver;
  }

  verbose(...args: any[]): void {
    this.resolver('debug', chalk.dim, args);
  }

  debug(...args: any[]): void {
    this.resolver('debug', chalk.gray, args);
  }

  log(...args: any[]): void {
    this.resolver('log', null, args);
  }

  success(...args: any[]): void {
    this.resolver('log', chalk.green, args);
  }

  info(...args: any[]): void {
    this.resolver('info', chalk.cyan, args);
  }

  warn(...args: any[]): void {
    this.resolver('warn', chalk.yellow.bold, args);
  }

  error(...args: any[]): void {
    this.resolver('error', chalk.red.bold, args);
  }

  batch(): LoggerBatch {
    return new LoggerBatch(this.resolver);
  }

  clearLine() {
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);
  }
}

/**
 * Batched logger, it batches all logs until they're flushed.
 * Useful for asynchronous simultaneous operations to preserve logs order.
 */
export class LoggerBatch extends Logger {
  readonly batchedLogs: [string, Chalk | null, any[]][] = [];
  readonly parentResolver: LoggerResolver;

  constructor(parentResolver: LoggerResolver = CONSOLE_RESOLVER) {
    super((level, color, args) => {
      this.batchedLogs.push([level, color, args]);
    });
    this.batchedLogs = [];
    this.parentResolver = parentResolver;
  }

  flush() {
    this.batchedLogs.forEach(([level, color, args]) => this.parentResolver(level, color, args));
    this.batchedLogs.length = 0;
  }
}

export default new Logger();
