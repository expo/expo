'use client';
import * as React from 'react';

import type { NavigationAction, NavigationState, ParamListBase } from '../routers';
import type { NavigationHelpers } from './types';

export type ListenerMap = {
  action: ChildActionListener;
  focus: FocusedNavigationListener;
};

export type KeyedListenerMap = {
  beforeRemove: ChildBeforeRemoveListener;
};

export type AddListener = <T extends keyof ListenerMap>(type: T, listener: ListenerMap[T]) => void;

export type AddKeyedListener = <T extends keyof KeyedListenerMap>(
  type: T,
  key: string,
  listener: KeyedListenerMap[T]
) => void;

export type ChildActionListener = (
  action: NavigationAction,
  visitedNavigators?: Set<string>
) => boolean;

export type FocusedNavigationCallback<T> = (navigation: NavigationHelpers<ParamListBase>) => T;

export type FocusedNavigationListener = <T>(callback: FocusedNavigationCallback<T>) => {
  handled: boolean;
  result: T;
};

export type ChildBeforeRemoveListener = (action: NavigationAction) => boolean;

export type DispatchRoot = (
  action: NavigationAction,
  options?: {
    originKey?: string;
    suppressUnhandled?: boolean;
    skipBeforeRemove?: boolean;
  }
) => boolean;

/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext<{
  onAction?: (action: NavigationAction, visitedNavigators?: Set<string>) => boolean;
  addListener?: AddListener;
  addKeyedListener?: AddKeyedListener;
  dispatchRoot?: DispatchRoot;
  // Commit a navigator's initial state into the store when its slice isn't committed yet: the root
  // (no compiler seed) or an unvisited/preloaded nested navigator. Splices `state` at the route
  // keyed `parentRouteKey` (or seeds the root when `parentRouteKey` is `undefined`) only if that
  // slot is still empty, so it's a one-time seed, never a compose-up.
  seedNavigatorState?: (parentRouteKey: string | undefined, state: NavigationState) => void;
  onDispatchAction: (action: NavigationAction, noop: boolean) => void;
  onOptionsChange: (options: object) => void;
  scheduleUpdate: (callback: () => void) => void;
  flushUpdates: () => void;
  stackRef?: React.MutableRefObject<string | undefined>;
}>({
  onDispatchAction: () => undefined,
  onOptionsChange: () => undefined,
  scheduleUpdate: () => {
    throw new Error("Couldn't find a context for scheduling updates.");
  },
  flushUpdates: () => {
    throw new Error("Couldn't find a context for flushing updates.");
  },
});
