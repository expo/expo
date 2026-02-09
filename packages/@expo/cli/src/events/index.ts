import { Console } from 'node:console';
import path from 'node:path';
import { WriteStream } from 'node:tty';

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

type EmptyPayloads = {
  [eventName: string]: never;
};

interface AbstractPayloads {
  [eventName: string]: Record<string, any>;
}

export interface EventLogger<Payloads extends AbstractPayloads> {
  <EventName extends keyof Payloads>(event: EventName, data: Payloads[EventName]): void;
}

export function events<const Payloads extends AbstractPayloads = EmptyPayloads>(
  category: string
): EventLogger<Payloads> {
  return function log<EventName extends keyof Payloads>(
    event: EventName,
    data: Payloads[EventName]
  ) {
    if (logStream) {
      const key = `${category}:${String(event)}`;
      const payload = JSON.stringify({ key, ...data });
      logStream._write(payload + '\n');
    }
  };
}
