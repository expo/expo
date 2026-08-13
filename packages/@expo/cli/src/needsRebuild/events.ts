import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'needs_rebuild:platform_check_failed': { platform: string; error: SerializedError };
    'needs_rebuild:device_read_failed': { device: string; error: SerializedError };
    'needs_rebuild:ranged_read_failed': { device: string; error: SerializedError };
  }
}

export const debugEvent = events.debug('needs_rebuild');
