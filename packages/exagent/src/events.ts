import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'cli:expo_resolved': { command: string; args: string[] };
    'cli:expo_exit': { code: number; signal?: string };
    'cli:expo_spawn_failed': { command: string; error: SerializedError };
    'cli:skills_sync_failed': { error: SerializedError };
    'cli:runtime_eval': { devServerUrl: string; threw: boolean; type: string };
    'cli:runtime_errors': { devServerUrl: string; durationMs: number; count: number };
    'cli:navigate': {
      route: string;
      url: string;
      platform: string;
      deviceId: string;
      exitCode: number | null;
    };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
