import { Console } from 'node:console';
import path from 'node:path';
import { WriteStream } from 'node:tty';

import type { EventBuilder, EventLoggerBuilder, EventShape } from './builder';
import { LogStream } from './stream';
import { env } from '../utils/env';

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
      } catch {
        logDestination = undefined;
      }
    }
  }
  return logDestination;
}

/** Activates the event logger based on the input env var
 * @param env - The target to write the logs to; defaults to `$EVENT_LOG`
 */
export function installEventLogger(env = process.env.EVENT_LOG) {
  const eventLogDestination = parseLogTarget(env);
  if (eventLogDestination) {
    if (eventLogDestination === 1) {
      const output = new WriteStream(2);
      Object.defineProperty(process, 'stdout', { get: () => output });
      globalThis.console = new Console(output, output);
    } else if (eventLogDestination === 2) {
      const output = new WriteStream(1);
      Object.defineProperty(process, 'stderr', { get: () => output });
      globalThis.console = new Console(output, output);
    }
    logStream = new LogStream(eventLogDestination);
  }
}

/** Returns whether the event logger is active */
export const isEventLoggerActive = () => !!logStream?.writable;

/** Whether logs shown in the terminal should be reduced.
 * @remarks
 * We indicate that we're in an automated tool (e.g. E2E tests) with `EXPO_UNSTABLE_HEADLESS`.
 * If the event logger is activate and we're running in a headless tool, we should reduce
 * interactive or noisy logs, in favour of the event logger.
 */
export const shouldReduceLogs = () => !!logStream && env.EXPO_UNSTABLE_HEADLESS;

/** Used to create an event logger for structured JSONL logs activated with the `EVENT_LOG` environment variable.
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
 * This will log a `{ key: 'test:my_event', myValue: 'test' }` entry in the event log.
 */
export const events: EventLoggerBuilder = ((
  category: string,
  _fn: (builder: EventBuilder) => readonly EventShape<string>[]
) => {
  function log(event: string, data: any) {
    if (logStream) {
      const key = `${category}:${String(event)}`;
      const payload = JSON.stringify({ key, ...data });
      logStream._write(payload + '\n');
    }
  }
  log.category = category;
  return log;
}) as EventLoggerBuilder;

export type { EventLogger } from './builder';
