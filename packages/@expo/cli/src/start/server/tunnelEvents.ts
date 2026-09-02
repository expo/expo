import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'tunnel:done': { provider: 'ngrok' | 'ws'; url: string };
    'tunnel:failed': { provider: 'ngrok' | 'ws'; error: SerializedError };
    'tunnel:url': { url: string };
    'tunnel:ngrok_subdomain': { subdomain: string };
    'tunnel:ngrok_hostname': { hostname: string };
    'tunnel:ngrok_config_path': { path: string };
    'tunnel:ngrok_randomness_reset': { randomness: string };
    'tunnel:ws_session': { session: string };
    'tunnel:ws_account_resolve_failed': { error: SerializedError };
    'tunnel:ws_signed_url_created': { accountId: string };
    'tunnel:ws_signed_url_failed': { error: SerializedError };
  }
}

export const event = events('tunnel');
export const debugEvent = events.debug('tunnel');
