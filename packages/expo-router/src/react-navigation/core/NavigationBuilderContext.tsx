'use client';
import * as React from 'react';

import type { RoutingIntent } from '../../global-state/routingQueue';
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
  handleIntent: (intent: Exclude<RoutingIntent, { type: 'BROWSER_HISTORY_CHANGED' }>) => void;
  resetNavigator: (stateKey: string, routerType: string | undefined) => void;
  addListener?: AddListener;
}>({
  handleAction: () => undefined,
  handleIntent: () => undefined,
  resetNavigator: () => undefined,
});
