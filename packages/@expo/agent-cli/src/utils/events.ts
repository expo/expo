import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'utils:agent_detect_failed': { error: SerializedError };
  }
}

/** Debug-level logger for the `utils` category. */
export const debugEvent = events.debug('utils');

/**
 * `utils` events. Only debug events are declared today, so this is the same logger
 * as {@link debugEvent}; it stays separate so call sites read like the `@expo/cli`
 * originals this code was ported from.
 */
export const event = debugEvent;
