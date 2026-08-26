import type { NavigationAction } from '../react-navigation/native';
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
      type: 'NAVIGATOR_ACTION';
      payload: {
        action: NavigationAction;
        dispatchSync: (action: NavigationAction) => void;
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
