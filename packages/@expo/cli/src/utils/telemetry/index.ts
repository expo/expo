import process from 'node:process';

import type { Telemetry } from './Telemetry';
import { commandEvent } from './events';
import type { TelemetryRecord } from './types';
import { getUserAsync } from '../../api/user/user';
import { env } from '../env';

/** The singleton telemetry manager to use */
let telemetry: Telemetry | null = null;

export function getTelemetry(): Telemetry | null {
  if (env.EXPO_NO_TELEMETRY || env.EXPO_OFFLINE) return null;

  if (!telemetry) {
    // Lazy load the telemetry client, only when enabled
    const { Telemetry } = require('./Telemetry') as typeof import('./Telemetry');
    telemetry = new Telemetry();

    // Flush any pending events on exit
    process.once('SIGINT', () => telemetry?.flushOnExit());
    process.once('SIGTERM', () => telemetry?.flushOnExit());
    process.once('beforeExit', () => telemetry?.flushOnExit());

    // Initialize the telemetry
    getUserAsync()
      .then((actor) => telemetry?.initialize({ userId: actor?.id ?? null }))
      .catch(() => telemetry?.initialize({ userId: null }));
  }

  return telemetry;
}

/**
 * Record a single telemetry event, or multiple in a single batch.
 * The event does not need to be awaited, its:
 *   - Not sent when using `EXPO_NO_TELEMETRY` or `EXPO_OFFLINE`, and returns `null`
 *   - Sent immediately for long running commands, returns the `fetch` promise
 *   - Queued and sent in background, returns `undefined`
 */
export function record(records: TelemetryRecord | TelemetryRecord[]) {
  return getTelemetry()?.record(records);
}

/**
 * Record a command invocation, and the name of the command.
 * This can be disabled with the $EXPO_NO_TELEMETRY environment variable.
 * We do this to determine how well deprecations are going before remove a command.
 */
export function recordCommand(command: string) {
  if (isLongRunningCommand(command)) {
    getTelemetry()?.setStrategy('instant');
  }

  return record(commandEvent(command));
}

/** Determine if the command is a long-running command, based on the command name */
function isLongRunningCommand(command: string) {
  return command === 'start' || command.startsWith('run') || command.startsWith('export');
}
