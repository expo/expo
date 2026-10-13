import { mark } from '../performance';
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
      // The browser moved on its own (back, forward, hash link); `id` is the entry id stored in
      // `history.state`, `null` when the browser created the entry without the router.
      type: 'BROWSER_HISTORY_CHANGED';
      payload: { id: string | null; path: string };
    }
) &
  RoutingIntentOptions;

// The queue tags each intent with the id reported by the action-enqueued and action-dispatched marks.
export type QueuedRoutingIntent = RoutingIntent & { actionId: number };

let lastActionId = 0;

/** Marks `expo-router:action-enqueued` and returns the id of the new action. */
export function markActionEnqueued(): number {
  const actionId = ++lastActionId;
  mark('expo-router:action-enqueued', { actionId });
  return actionId;
}
