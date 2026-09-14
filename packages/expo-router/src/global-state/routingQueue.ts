import type { NavigationAction, NavigationState } from '../react-navigation/native';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions } from './types';

interface NavigateToHrefIntent {
  type: 'NAVIGATE_TO_HREF';
  payload: {
    options: LinkToOptions;
    href: string;
    originalHref?: string;
  };
}

export type RoutingIntent =
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
      // The browser moved on its own (back, forward, hash link); `id` is the entry id stored in
      // `history.state`, `null` when the browser created the entry without the router.
      type: 'BROWSER_HISTORY_CHANGED';
      payload: { id: string | null; path: string };
    };
