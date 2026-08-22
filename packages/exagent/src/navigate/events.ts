import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'navigate:device_resolved': { platform: string; deviceId: string };
    'navigate:target_decided': { isExpoGo: boolean; reason: string };
    'navigate:url_resolved': { url: string; resolution: string };
  }
}

export const event = events('navigate');
export const debugEvent = events.debug('navigate');
