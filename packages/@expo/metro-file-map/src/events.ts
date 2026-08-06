import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'filemap:build': { crawler: 'node' | 'watchman'; fromCache: boolean };
    'filemap:cache:read_error': { error: SerializedError };
    'filemap:watchman:unavailable': { reason: string };

    'filemap:hydrate': { fromCache: boolean };
    'filemap:crawl': {
      crawler: 'node' | 'watchman';
      full: boolean;
      changed: number;
      removed: number;
    };
    'filemap:process': { processed: number };
    'filemap:persist': Record<string, never>;
  }
}

export const event = events('filemap');
export const debugEvent = events.debug('filemap');
