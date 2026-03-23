import type {
  NavigationAction,
  NavigationState,
  ParamListBase,
} from '@react-navigation/routers';
import * as React from 'react';

import type { NavigationHelpers } from './types';

export type ListenerMap = {
  action: ChildActionListener;
  focus: FocusedNavigationListener;
};

export type KeyedListenerMap = {
  getState: GetStateListener;
  beforeRemove: ChildBeforeRemoveListener;
};

export type AddListener = <T extends keyof ListenerMap>(
  type: T,
  listener: ListenerMap[T]
) => void;

export type AddKeyedListener = <T extends keyof KeyedListenerMap>(
  type: T,
  key: string,
  listener: KeyedListenerMap[T]
) => void;

export type ChildActionListener = (
  action: NavigationAction,
  visitedNavigators?: Set<string>
) => boolean;

export type FocusedNavigationCallback<T> = (
  navigation: NavigationHelpers<ParamListBase>
) => T;

export type FocusedNavigationListener = <T>(
  callback: FocusedNavigationCallback<T>
) => {
  handled: boolean;
  result: T;
};

export type GetStateListener = () => NavigationState;

export type ChildBeforeRemoveListener = (action: NavigationAction) => boolean;

/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext<{
  onAction?: (
    action: NavigationAction,
    visitedNavigators?: Set<string>
  ) => boolean;
  addListener?: AddListener;
  addKeyedListener?: AddKeyedListener;
  onRouteFocus?: (key: string) => void;
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
