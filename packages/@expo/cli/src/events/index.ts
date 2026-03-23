import { Console } from 'node:console';
import fs from 'node:fs';
import path from 'node:path';

import type { EventBuilder, EventLoggerBuilder, EventShape } from './builder';
import { LogStream } from './stream';
import { env } from '../utils/env';

interface InitMetadata {
  format: 'v0-jsonl' | (string & {});
  version: string;
}

let logPath = process.cwd();
let logStream: LogStream | undefined;
let projectLogStream: LogStream | undefined;
let projectLogRelativePath: string | undefined;
let earlyBuffer: string[] = [];

function parseLogTarget(env: string | undefined) {
  let logDestination: string | number | undefined;
  if (env) {
    const fd = parseInt(env, 10);
    if (fd > 0 && Number.isSafeInteger(fd)) {
      logDestination = fd;
    } else {
      try {
        const parsedPath = path.parse(env);
        logDestination = path.format(parsedPath);
        logPath = parsedPath.dir;
      } catch {
        logDestination = undefined;
      }
    }
  }
  return logDestination;
}

function getInitMetadata(): InitMetadata {
  return {
    format: 'v0-jsonl',
    // Version is added in the build script.
    version: process.env.__EXPO_VERSION ?? 'UNVERSIONED',
  };
}

/** Activates the event logger based on the input env var
 * @param env - The target to write the logs to; defaults to `$LOG_EVENTS`
 */
export function installEventLogger(env = process.env.LOG_EVENTS) {
  const eventLogDestination = parseLogTarget(env);
  if (eventLogDestination) {
    if (eventLogDestination === 1) {
      // Reuse Node's existing stdio streams so redirected or piped terminals don't
      // attempt TTY-only initialization when LOG_EVENTS swaps console output.
      const output = process.stderr;
      Object.defineProperty(process, 'stdout', { get: () => output });
      globalThis.console = new Console(output, output);
    } else if (eventLogDestination === 2) {
      const output = process.stdout;
      Object.defineProperty(process, 'stderr', { get: () => output });
      globalThis.console = new Console(output, output);
    }
    logStream = new LogStream(eventLogDestination);
    rootEvent('init', getInitMetadata());
  }
}

/** Returns whether the event logger is active */
export const isEventLoggerActive = () => !!logStream?.writable;

/** Returns the relative path to the project log file, if active */
export const getProjectLogPath = () => projectLogRelativePath;

/** Whether logs shown in the terminal should be reduced.
 * @remarks
 * We indicate that we're in an automated tool (e.g. E2E tests) with `EXPO_UNSTABLE_HEADLESS`.
 * If the event logger is activate and we're running in a headless tool, we should reduce
 * interactive or noisy logs, in favour of the event logger.
 */
export const shouldReduceLogs = () => !!logStream && env.EXPO_UNSTABLE_HEADLESS;

/** Used to create an event logger for structured JSONL logs activated with the `LOG_EVENTS` environment variable.
 *
 * @remarks
 * Structured logs are streamed to a JSONL output file or file descriptor, and are meant for automated tooling
 * or normal usage to document what happened during a user session. When creating a module that outputs errors,
 * events, or captures what the user was doing, create a new event logger category for them and add structured
 * log events.
 * For example, `../start/server/metro/MetroTerminalReporter` captures most of Metro's logged events.
 * Structured JSONL logs don't have a large performance impact, unlike `DEBUG` logs, and are easily parseable
 * and filterable, including by wrapper processes.
 *
 * After adding a new event category, don't forget to add it to `./types.ts` to collect all event shape types
 * in one place.
 *
 * @example
 * ```ts
 * export const event = events('test', (t) => [
 *   t.event<'my_event', {
 *     myValue: string | null;
 *   }>(),
 * ]);
 *
 * event('my_event', { myValue: 'test' });
 * ```
 *
 * This will log a `{ _e: 'test:my_event', _t: 0, myValue: 'test' }` entry in the event log.
 */
export const events: EventLoggerBuilder = ((
  category: string,
  _fn: (builder: EventBuilder) => readonly EventShape<string>[]
) => {
  function log(event: string, data: any) {
    const _e = `${category}:${String(event)}`;
    const _t = Date.now();
    const payload = JSON.stringify({ _e, _t, ...data });
    const line = payload + '\n';
    if (logStream) {
      logStream._write(line);
    }
    if (projectLogStream) {
      projectLogStream._write(line);
    } else if (earlyBuffer.length < 1000) {
      earlyBuffer.push(line);
    }
  }
  log.category = category;

  log.path = function relativePath(target: string | undefined | null): string | null {
    try {
      return target != null && path.isAbsolute(target)
        ? path.relative(logPath, target).replace(/\\/, '/') || '.'
        : (target ?? null);
    } catch {
      return target || null;
    }
  };

  return log;
}) as EventLoggerBuilder;

// These are built-in events: We choose an ambiguous name on purpose,
// since we don't assume this implementation will necessarily only be in `@expo/cli`
export const rootEvent = events('root', (t) => [t.event<'init', InitMetadata>()]);

/**
 * Activates the project log stream, writing JSONL events to `.expo/dev/logs/<command>.log`.
 * Any events emitted before this call are buffered and flushed to the file.
 * This is idempotent — subsequent calls are no-ops.
 */
export function setProjectLogRoot(projectRoot: string, command: string): string | undefined {
  if (projectLogStream) return;
  const logFile = path.join(projectRoot, '.expo', 'dev', 'logs', `${command}.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, ''); // truncate from previous run
  projectLogStream = new LogStream(logFile);
  for (const line of earlyBuffer) {
    projectLogStream._write(line);
  }
  earlyBuffer.length = 0;
  projectLogRelativePath = '.expo/dev/logs/' + command + '.log';
  return projectLogRelativePath;
}

process.once('exit', () => {
  projectLogStream?._end();
});

export type { EventLogger } from './builder';
