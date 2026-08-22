import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'runtime:cdp_message': { url: string; message: string };
    'runtime:cdp_socket_error': { url: string; error: string };
    'runtime:cdp_target_skipped': { url: string; reason: string };
    'runtime:cdp_parse_failed': { reason: string };
  }
}

export const event = events('runtime');
export const debugEvent = events.debug('runtime');
