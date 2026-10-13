import type { NavigationAction, NavigationState } from '../react-navigation/native';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, RouterResetState } from './types';

interface NavigateToHrefIntent {
  type: 'NAVIGATE_TO_HREF';
  payload: {
    options: LinkToOptions;
    href: string;
    originalHref?: string;
  };
}

type RoutingIntentOptions = {
  inTransition?: boolean;
};

export type RoutingIntent = (
  | NavigateToHrefIntent
  | {
      type: 'COMPUTED_ACTION';
      payload: {
        compute: (state: NavigationState, registry: RouterRegistry) => NavigationAction | undefined;
        originKey?: string;
      };
    }
  | {
      type: 'ACTION';
      payload: { action: NavigationAction; originKey?: string };
    }
  | {
      // Built into a root `RESET` by the reducer, which knows the route tree.
      type: 'RESET_ROUTES';
      payload: { state: RouterResetState };
    }
  | {
      // The browser moved on its own (back, forward, hash link); `id` is the entry id stored in
      // `history.state`, `null` when the browser created the entry without the router.
      type: 'BROWSER_HISTORY_CHANGED';
      payload: { id: string | null; path: string };
    }
) &
  RoutingIntentOptions;
