import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'reload:attempt': { method: string; ok: boolean; reason: string | null };
    'reload:peers_read': { count: number | null; when: string };
    'reload:broadcast_sent': { devServerUrl: string };
    /** The one-verb relaunch on a cloud session (`./cloudReload.ts`). */
    'reload:cloud_relaunch': { exitCode: number | null; url: string; appId: string };
    /** The same verb, bound to the controller session that held the device (S14). */
    'reload:cloud_relaunch_bound': { session: string; exitCode: number | null };
    /** What the dev server was seen to serve after the app was relaunched (`./bundleSignal.ts`). */
    'reload:bundle_observed': { observed: boolean; newBundles: number; waitedMs: number };
    'reload:done': {
      reloaded: boolean;
      method: string | null;
      appsConnected: number;
      /** How many of those the dev server had not listed before the reload. */
      appsReconnected: number;
      route: string | null;
    };
  }
}

export const event = events('reload');
export const debugEvent = events.debug('reload');
