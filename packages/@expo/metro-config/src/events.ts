import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'config:missing_winter_runtime': Record<string, never>;
    'config:missing_metro_runtime': Record<string, never>;
    'config:router:root_directory': { dir: string };
    'config:rewrite_url:rewriting': { url: string; platform: string };
    'config:rewrite_url:resolved_entry': {
      entry: string;
      relativeEntry: string;
      serverRoot: string;
    };
    'config:rewrite_url:redirected': { url: string };
    'config:rewrite_url:hermes_enabled': Record<string, never>;
    'config:cache:skipped_css': { path: string };
    'config:cache:rename_failed': { error: SerializedError };
    'config:cache:tombstone_remove_failed': { tombstone: string; error: SerializedError };
  }
}

export const event = events.debug('config');
