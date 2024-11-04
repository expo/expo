import type { TelemetryRecord } from './types';

/** A single command invocation, with the invoked command name */
export function commandEvent(commandName: string): TelemetryRecord {
  return {
    event: 'action',
    properties: {
      action: `expo ${commandName}`,
    },
  };
}
