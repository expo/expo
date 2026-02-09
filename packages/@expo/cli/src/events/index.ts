import { Console } from 'node:console';
import path from 'node:path';
import { WriteStream } from 'node:tty';

import type { EventBuilder, EventLoggerBuilder, EventShape } from './builder';
import { LogStream } from './stream';

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

export const shouldLogEvents = () => !!logStream;

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
