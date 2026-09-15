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

interface RoutingIntentMetadata {
  history?: {
    path: string;
  };
}

type RoutingIntentOptions = {
  inTransition?: boolean;
  metadata?: RoutingIntentMetadata;
  onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
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
) &
  RoutingIntentOptions;
