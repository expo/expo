import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'devserver:platform_manager_created': { platform: string; port: number };
    'devserver:session_ping': { runtime: string; url: string };
    'devserver:session_ping_failed': { error: SerializedError };
    'devserver:session_close_failed': { error: SerializedError };
    'devserver:runtime_mode_switched': { mode: string };
    'devserver:loading_url': { url: string };
    'devserver:dev_client_url_invalid_protocol': { protocol: string };
    'devserver:dev_client_url': { url: string; manifestUrl: string };
    'devserver:devices_saved': { ids: string[] };
  }
}

export const debugEvent = events.debug('devserver');
