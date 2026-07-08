import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'tunnel:done': { provider: 'ngrok' | 'ws'; url: string };
    'tunnel:failed': { provider: 'ngrok' | 'ws'; error: SerializedError };
  }
}

export const event = events('tunnel');
