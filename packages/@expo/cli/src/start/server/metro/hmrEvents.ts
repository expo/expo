import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'hmr:broadcast_failed': { socketId: string; error: SerializedError };
    'hmr:socket_not_found': { id: string };
    'hmr:message_parse_failed': { error: SerializedError };
    'hmr:protocol_version_mismatch': { expected: number; received: unknown };
    'hmr:events_unknown_message': { type: string };
  }
}

export const event = events.debug('hmr');
