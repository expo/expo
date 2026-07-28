import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'devtools:mcp_tunnel_create': { url: string };
    'devtools:mcp_tunnel_failed': { error: SerializedError };
    'devtools:mcp_extension_installed': { packageName: string; commandCount: number };
    'devtools:plugin_request_failed': { error: SerializedError };
  }
}

export const debugEvent = events.debug('devtools');
