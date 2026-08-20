import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'cli:expo_resolved': { command: string; args: string[] };
    'cli:expo_exit': { code: number; signal?: string };
    'cli:expo_spawn_failed': { command: string; error: SerializedError };
    'cli:skills_sync_failed': { error: SerializedError };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
