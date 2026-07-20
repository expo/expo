import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'api:download': {
      url: string;
      bytes: number;
      ms: number;
    };
    'api:cache_store_failed': { url: string };
    'api:logout_server_failed': { error: SerializedError };
    'api:download_started': { url: string; output: string };
    'api:extract_started': { input: string; output: string };
    'api:expo_go_version_resolved': { sdkVersion: string; url: string };
    'api:expo_go_download_started': { url: string; output: string };
    'api:expo_go_cache_removed': { path: string };
    'api:progress_size': { url: string; bytes: number };
  }
}

export const event = events('api');
export const debugEvent = events.debug('api');
