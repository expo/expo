import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'navigate:device_resolved': { platform: string; deviceId: string };
    'navigate:target_decided': { isExpoGo: boolean; reason: string };
    'navigate:url_resolved': { url: string; resolution: string };
    /** One `adb reverse` of the dev server's port onto the device (`./adbReverse.ts`). */
    'navigate:adb_reverse': { port: number; deviceId: string; exitCode: number | null };
    /** The reverse did not go in, so the link that follows may reach nothing. */
    'navigate:adb_reverse_failed': { reason: string };
    /** The app was stopped and the link opened again, because nothing had attached. */
    'navigate:attach_recovery': { appId: string; stopped: boolean };
    'navigate:route_checked': {
      checked: boolean;
      ok: boolean | null;
      matched: string | null;
      routeCount: number;
      reason: string | null;
    };
  }
}

export const event = events('navigate');
export const debugEvent = events.debug('navigate');
