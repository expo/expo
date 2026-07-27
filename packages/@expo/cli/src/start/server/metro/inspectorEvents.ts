import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'inspector:open_missing_device_id': Record<string, never>;
    'inspector:open_no_response': Record<string, never>;
    'inspector:open_failed': { status: number };
    'inspector:handler_init': { title: string };
    'inspector:handler_unsupported': { title: string };
    'inspector:handler_all_disabled': Record<string, never>;
    'inspector:handler_ready': { handlers: string };
    'inspector:network_cdp_failed': { error: SerializedError };
  }
}

export const event = events.debug('inspector');
