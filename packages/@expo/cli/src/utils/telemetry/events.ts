import { events } from '2g';
import type { SerializedError } from '2g';

import type { TelemetryRecord } from './types';

declare module '2g' {
  interface EventRegistry {
    'telemetry:strategy_changed': { from: string; to: string };
    'telemetry:flush_error': { error: SerializedError };
    'telemetry:agent_detect_failed': { error: SerializedError };
    'telemetry:sandbox_detect_failed': { error: SerializedError };
  }
}

export const debugEvent = events.debug('telemetry');

/** A single command invocation, with the invoked command name */
export function commandEvent(commandName: string): TelemetryRecord {
  return {
    event: 'action',
    properties: {
      action: `expo ${commandName}`,
    },
  };
}
