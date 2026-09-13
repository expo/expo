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
  metadata?: RoutingIntentMetadata;
  onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
}

interface RoutingIntentMetadata {
  history?: {
    path: string;
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
      metadata?: RoutingIntentMetadata;
      onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
    }
  | {
      type: 'ACTION';
      payload: { action: NavigationAction; originKey?: string };
      metadata?: RoutingIntentMetadata;
      onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
    };
