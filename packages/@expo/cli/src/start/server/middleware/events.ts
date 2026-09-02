import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'middleware:create_file:parse_error': { error: SerializedError };
    'middleware:create_file:resolved_path': { path: string };
    'middleware:create_file:write_error': { error: SerializedError };
    'middleware:favicon:generate_failed': { error: SerializedError };
    'manifest:no_platform_header': Record<string, never>;
    'manifest:resolved_entry': { path: string };
    'manifest:runtime_version_resolved': { result: string };
  }
}

export const event = events.debug('middleware');
export const manifestDebugEvent = events.debug('manifest');
