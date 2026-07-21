'use client';
import * as React from 'react';

import type { NavigationAction, ParamListBase } from '../routers';
import type { NavigationHelpers } from './types';

export type ListenerMap = {
  action: ChildActionListener;
  focus: FocusedNavigationListener;
};

export type AddListener = <T extends keyof ListenerMap>(type: T, listener: ListenerMap[T]) => void;

export type ChildActionListener = (
  action: NavigationAction,
  visitedNavigators?: Set<string>
) => boolean;

export type FocusedNavigationCallback<T> = (navigation: NavigationHelpers<ParamListBase>) => T;

export type FocusedNavigationListener = <T>(callback: FocusedNavigationCallback<T>) => {
  handled: boolean;
  result: T;
};

export type DispatchRoot = (
  action: NavigationAction,
  options?: {
    originKey?: string;
  }
) => boolean;

/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext<{
  onAction?: (action: NavigationAction, visitedNavigators?: Set<string>) => boolean;
  addListener?: AddListener;
  dispatchRoot?: DispatchRoot;
  onOptionsChange: (options: object) => void;
  scheduleUpdate: (callback: () => void) => void;
  flushUpdates: () => void;
}>({
  onOptionsChange: () => undefined,
  scheduleUpdate: () => {
    throw new Error("Couldn't find a context for scheduling updates.");
  },
  flushUpdates: () => {
    throw new Error("Couldn't find a context for flushing updates.");
  },
});
