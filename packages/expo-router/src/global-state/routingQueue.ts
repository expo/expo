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
}

export interface RoutingIntentMetadata {
  history?: {
    path: string;
  };
}

export type RoutingIntent =
  | NavigateToHrefIntent
  | {
      type: 'ACTION';
      payload: { action: NavigationAction; originKey?: string };
      metadata?: RoutingIntentMetadata;
    };
