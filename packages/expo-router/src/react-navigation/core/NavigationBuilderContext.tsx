'use client';
import * as React from 'react';

import type { NavigationAction, ParamListBase } from '../routers';
import type { NavigationHelpers } from './types';

export type ListenerMap = {
  focus: FocusedNavigationListener;
};

export type AddListener = <T extends keyof ListenerMap>(type: T, listener: ListenerMap[T]) => void;

export type FocusedNavigationCallback<T> = (navigation: NavigationHelpers<ParamListBase>) => T;

export type FocusedNavigationListener = <T>(callback: FocusedNavigationCallback<T>) => {
  handled: boolean;
  result: T;
};

/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext<{
  handleAction: (action: NavigationAction, originKey?: string) => void;
  resetNavigator: (stateKey: string, routerType: string | undefined) => void;
  addListener?: AddListener;
  onOptionsChange: (options: object, routeKey?: string) => void;
}>({
  handleAction: () => undefined,
  resetNavigator: () => undefined,
  onOptionsChange: () => undefined,
});
