import { Console } from 'node:console';
import path from 'node:path';

import type { EventBuilder, EventLoggerBuilder, EventShape } from './builder';
import { LogStream, writeEvent } from './stream';
import { env } from '../utils/env';

interface InitMetadata {
  format: 'v0-jsonl' | (string & {});
  version: string;
}

let logPath = process.cwd();
let logStream: LogStream | undefined;

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

export function getWellKnownTemporaryLogFile(projectRoot: string, command: string): string {
  return path.join(projectRoot, '.expo', 'dev', 'logs', `${command}.log`);
}

/** Activates the event logger.
 *
 * Accepts either a log target string (file path, fd number, or `$LOG_EVENTS`),
 * or a `projectRoot` + `command` pair to log to `.expo/dev/logs/<command>.log`.
 * Subsequent calls are no-ops — the first activated destination wins.
 */
export function installEventLogger(env: string | undefined = process.env.LOG_EVENTS) {
  if (logStream) return;
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

/** Returns the file path of the active event log, if any */
export const getLogFile = () => logStream?.file ?? undefined;

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
    if (logStream) {
      writeEvent(logStream, category, event, data);
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

export type { EventLogger } from './builder';
