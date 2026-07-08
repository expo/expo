import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'interface:key_pressed': { key: string };
    'interface:banners_failed': { error: SerializedError };
    'interface:action_failed': { error: SerializedError };
  }
}

export const event = events.debug('interface');
