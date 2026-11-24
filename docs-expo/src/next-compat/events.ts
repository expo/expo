type RouteEvent =
  | 'routeChangeStart'
  | 'routeChangeComplete'
  | 'routeChangeError'
  | 'beforeHistoryChange'
  | 'hashChangeStart'
  | 'hashChangeComplete';

type RouteEventHandler = (...args: any[]) => void;

const handlers = new Map<RouteEvent, Set<RouteEventHandler>>();

/** The `router.events` API of Next.js. Expo Router has no route change events. */
export const events = {
  on(event: RouteEvent, handler: RouteEventHandler) {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler);
  },
  off(event: RouteEvent, handler: RouteEventHandler) {
    handlers.get(event)?.delete(handler);
  },
  emit(event: RouteEvent, ...args: any[]) {
    handlers.get(event)?.forEach(handler => handler(...args));
  },
};
