import { Telemetry } from './Telemetry';
import type { TelemetryRecord } from './types';
import { env } from '../env';

/** The singleton telemetry manager to use */
let telemetry: Telemetry | null = null;

export function getTelemetry(): Telemetry | null {
  if (env.EXPO_NO_TELEMETRY || env.EXPO_OFFLINE) return null;

  if (!telemetry) {
    telemetry = new Telemetry({ anonymousId: 'TODO' });

    process.once('SIGINT', () => telemetry!.flushOnExit());
    process.once('SIGTERM', () => telemetry!.flushOnExit());
    process.once('beforeExit', () => telemetry!.flushOnExit());
  }

  return telemetry;
}

/**
 * Record a single, or multiple telemetry events.
 * The event does not need to be awaited, its:
 *   - Not sent when using `EXPO_NO_TELEMETRY` or `EXPO_OFFLINE`, and returns `null`
 *   - Sent immediately for long running commands, returns the `fetch` promise
 *   - Queued and sent in background, returns `undefined`
 */
export function recordEvent(records: TelemetryRecord | TelemetryRecord[]) {
  return getTelemetry()?.record(records);
}

/**
 * Record a single command being invoked.
 * This changes the telemetry strategy for long running commands.
 */
export function recordCommandEvent(command: string) {
  if (isLongRunningCommand(command)) {
    getTelemetry()?.setStrategy('instant');
  }

  return recordEvent({ event: 'action', properties: { command: `expo ${command}` } });
}

/** Determine if the command is a long-running command, based on the command name */
function isLongRunningCommand(command: string) {
  return command === 'start' || command.startsWith('run') || command.startsWith('export');
}
