import * as fs from 'node:fs';
import * as path from 'node:path';

import { stripAnsi } from './ansi';
import { env } from './env';

// Save original write functions BEFORE any patching
const originalStdoutWrite = process.stdout.write.bind(process.stdout);

/** Get the output file path if EXPO_UNSTABLE_JSONL_OUTPUT is a path string */
function getOutputFilePath(): string | null {
  const value = env.EXPO_UNSTABLE_JSONL_OUTPUT;
  if (typeof value === 'string') {
    try {
      fs.mkdirSync(path.dirname(value), { recursive: true });
      fs.writeFileSync(value, '');
    } catch (error) {
      // Silently ignore, the process will error on write if the directory does not exist
    }
    return path.resolve(value);
  }
  return null;
}

/** Base event */
export interface JsonlEvent {
  type: string;
  timestamp: number; // Unix timestamp in milliseconds
}

/** Console output from JS runtime */
export interface JsonlConsoleEvent extends JsonlEvent {
  type:
    | 'console.log'
    | 'console.error'
    | 'console.warn'
    | 'console.debug'
    | 'console.info'
    | 'console.trace'
    | 'console.group'
    | 'console.groupCollapsed'
    | 'console.groupEnd';
  source: 'server' | 'client';
  platform?: 'ios' | 'android' | 'web'; // Extracted from bundle URL in stack traces
  value: string;
}

/** Generic stdout/stderr output from CLI */
export interface JsonlStdEvent extends JsonlEvent {
  type: 'stdout' | 'stderr';
  value: string;
}

/** Bundling started */
export interface JsonlBundlingStartedEvent extends JsonlEvent {
  type: 'bundling.started';
  id: string;
  platform: 'ios' | 'android' | 'web' | string;
  path: string;
  environment?: 'client' | 'node' | 'react-server'; // For SSR, API routes, RSC
}

/** Bundling progress */
export interface JsonlBundlingProgressEvent extends JsonlEvent {
  type: 'bundling.progress';
  id: string;
  progress: number; // 0-1
  files: {
    total: number;
    current: number;
  };
}

/** Bundling completed successfully */
export interface JsonlBundlingDoneEvent extends JsonlEvent {
  type: 'bundling.done';
  id: string;
  duration: number | undefined; // milliseconds
  modules: {
    total: number;
  };
}

/** Bundling error (combined failure + error details) */
export interface JsonlBundlingErrorEvent extends JsonlEvent {
  type: 'bundling.error';
  id?: string;
  value: string; // Error message
  duration?: number; // milliseconds (if available)
}

export type JsonlEventType =
  | JsonlConsoleEvent
  | JsonlStdEvent
  | JsonlBundlingStartedEvent
  | JsonlBundlingProgressEvent
  | JsonlBundlingDoneEvent
  | JsonlBundlingErrorEvent;

/** Payload type for emit method (without timestamp) */
type JsonlEventPayload =
  | Omit<JsonlConsoleEvent, 'timestamp'>
  | Omit<JsonlStdEvent, 'timestamp'>
  | Omit<JsonlBundlingStartedEvent, 'timestamp'>
  | Omit<JsonlBundlingProgressEvent, 'timestamp'>
  | Omit<JsonlBundlingDoneEvent, 'timestamp'>
  | Omit<JsonlBundlingErrorEvent, 'timestamp'>;

export class JsonlReporter {
  private outputFilePath: string | null;

  constructor() {
    this.outputFilePath = getOutputFilePath();
  }

  get isEnabled(): boolean {
    return !!env.EXPO_UNSTABLE_JSONL_OUTPUT;
  }

  /** Get the output file path (null if writing to stdout) */
  getOutputFilePath(): string | null {
    return this.outputFilePath;
  }

  /** Emit a JSONL event to stdout or file */
  public emit(event: JsonlEventPayload): boolean {
    const eventWithTimestamp = { ...event, timestamp: Date.now() };
    const line = JSON.stringify(eventWithTimestamp) + '\n';

    if (this.outputFilePath) {
      // Append to file
      // TODO: Consider using async queue to write to file
      fs.appendFileSync(this.outputFilePath, line);
    } else {
      // Write to stdout using the original (unpatched) write function
      originalStdoutWrite(line);
    }
    return true;
  }

  /** Emit stdout output */
  public emitStdout(value: string): boolean {
    return this.emit({ type: 'stdout', value: stripAnsi(value) ?? '' });
  }

  /** Emit stderr output */
  public emitStderr(value: string): boolean {
    return this.emit({ type: 'stderr', value: stripAnsi(value) ?? '' });
  }

  /** Emit console log from client or server */
  public emitConsole(options: {
    level:
      | 'log'
      | 'error'
      | 'warn'
      | 'debug'
      | 'info'
      | 'trace'
      | 'group'
      | 'groupCollapsed'
      | 'groupEnd';
    source: 'server' | 'client';
    platform?: 'ios' | 'android' | 'web';
    value: string | any[];
  }): boolean {
    return this.emit({
      type: `console.${options.level}`,
      source: options.source,
      platform: options.platform,
      value: Array.isArray(options.value)
        ? // Due to serialization on the client side, these will mostly be arrays of strings
          // but to be safe, we stringify the array. Eventually we would like to send the as-is.
          // To get more detailed logs.
          options.value.map((item: unknown) => String(item)).join(' ')
        : String(options.value),
    });
  }

  /** Emit console log from server */
  public emitServerLog(options: {
    level: 'info' | 'warn' | 'error' | undefined;
    value: string | any[];
  }): boolean {
    return this.emitConsole({
      level: options.level ?? 'log',
      source: 'server',
      value: options.value,
    });
  }

  /** Emit bundling started event */
  public emitBundlingStarted(options: {
    id: string;
    platform: string;
    path: string;
    environment?: 'client' | 'node' | 'react-server';
  }): boolean {
    return this.emit({
      type: 'bundling.started',
      id: options.id,
      platform: options.platform,
      path: options.path,
      environment: options.environment,
    });
  }

  /** Emit bundling progress event */
  public emitBundlingProgress(options: {
    id: string;
    progress: number;
    total: number;
    current: number;
  }): boolean {
    return this.emit({
      type: 'bundling.progress',
      id: options.id,
      progress: options.progress,
      files: {
        total: options.total,
        current: options.current,
      },
    });
  }

  /** Emit bundling done event */
  public emitBundlingDone(options: {
    id: string;
    duration: number | undefined;
    totalModules: number;
  }): boolean {
    return this.emit({
      type: 'bundling.done',
      id: options.id,
      duration: options.duration,
      modules: {
        total: options.totalModules,
      },
    });
  }

  /** Emit bundling error event */
  public emitBundlingError(options: {
    id: string | undefined;
    value: string;
    duration?: number;
    filename?: string;
    lineNumber?: number;
    column?: number;
  }): boolean {
    return this.emit({
      type: 'bundling.error',
      id: options.id,
      value: stripAnsi(options.value) ?? '',
      duration: options.duration,
    });
  }
}

let reporterInstance: JsonlReporter | null = null;

/** Get the singleton JSONL reporter instance */
export function getJsonlReporter(): JsonlReporter {
  if (!reporterInstance) {
    if (env.EXPO_UNSTABLE_JSONL_OUTPUT) {
      reporterInstance = new JsonlReporter();
    } else {
      // Use noop reporter
      reporterInstance = {
        get isEnabled(): boolean {
          return false;
        },
        getOutputFilePath: () => null,
        emit: () => false,
        emitStdout: () => false,
        emitStderr: () => false,
        emitConsole: () => false,
        emitServerLog: () => false,
        emitBundlingStarted: () => false,
        emitBundlingProgress: () => false,
        emitBundlingDone: () => false,
        emitBundlingError: () => false,
      } as unknown as JsonlReporter;
    }
  }
  return reporterInstance;
}

/** Install JSONL interceptor to patch process.stdout.write and process.stderr.write */
export function installJsonlInterceptor(): void {
  if (!env.EXPO_UNSTABLE_JSONL_OUTPUT) return;

  const reporter = getJsonlReporter();
  const outputFilePath = reporter.getOutputFilePath();

  // If writing to a file, print a message to stdout to inform users
  if (outputFilePath) {
    originalStdoutWrite(`JSONL output is being written to: ${outputFilePath}\n`);
  }

  // Patch stdout
  process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
    const str = typeof chunk === 'string' ? chunk : chunk.toString();
    reporter.emitStdout(str);

    // Call callback if provided (for stream compatibility)
    if (typeof encoding === 'function') encoding();
    else if (typeof callback === 'function') callback();
    return true;
  };

  // Patch stderr
  process.stderr.write = (chunk: any, encoding?: any, callback?: any) => {
    const str = typeof chunk === 'string' ? chunk : chunk.toString();
    reporter.emitStderr(str);

    if (typeof encoding === 'function') encoding();
    else if (typeof callback === 'function') callback();
    return true;
  };
}
