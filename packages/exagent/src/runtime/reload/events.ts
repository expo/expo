import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'reload:attempt': { method: string; ok: boolean; reason: string | null };
    'reload:peers_read': { count: number | null; when: string };
    'reload:broadcast_sent': { devServerUrl: string };
    'reload:done': {
      reloaded: boolean;
      method: string | null;
      appsConnected: number;
      route: string | null;
    };
  }
}

export const event = events('reload');
export const debugEvent = events.debug('reload');
