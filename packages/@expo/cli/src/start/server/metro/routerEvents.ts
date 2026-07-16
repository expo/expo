import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'router:entry_resolved': { routerEntry: string; appFolder: string; appRoot: string };
    'router:manifest_fetched': Record<string, never>;
    'router:api_route_bundling': { path: string };
    'router:middleware_bundling': { path: string };
    'router:static_overlay_failed': { error: string };
  }
}

export const event = events.debug('router');
