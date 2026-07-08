import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'transform:worker:started': { pid: number };
    'transform:failed': { file: string; error: SerializedError };
    'transform:custom_transformer:loaded': { path: string };
    'transform:custom_transformer:failed': { path: string; error: SerializedError };

    'transform:file': {
      file: string;
      platform: string | null;
      environment: string | null;
      type: string;
      deps: number;
      cached: false;
    };
  }
}

export const event = events('transform');
export const debugEvent = events.debug('transform');
