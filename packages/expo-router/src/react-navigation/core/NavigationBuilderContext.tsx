'use client';
import * as React from 'react';

import type { NavigationAction, NavigationState, ParamListBase } from '../routers';
import type { NavigationHelpers } from './types';

export type ListenerMap = {
  focus: FocusedNavigationListener;
};

export type KeyedListenerMap = {
  preventRemove: ChildPreventRemoveListener;
  beforeRemove: ChildBeforeRemoveListener;
};

export type AddListener = <T extends keyof ListenerMap>(type: T, listener: ListenerMap[T]) => void;

export type AddKeyedListener = <T extends keyof KeyedListenerMap>(
  type: T,
  key: string,
  listener: KeyedListenerMap[T]
) => void;

export type FocusedNavigationCallback<T> = (navigation: NavigationHelpers<ParamListBase>) => T;

export type FocusedNavigationListener = <T>(callback: FocusedNavigationCallback<T>) => {
  handled: boolean;
  result: T;
};

export type ChildPreventRemoveListener = (action: NavigationAction) => boolean;

export type ChildBeforeRemoveListener = (action: NavigationAction) => void;

export type HandleActionResult = {
  handled: boolean;
  originStateKey?: string;
};

/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext<{
  handleAction: (action: NavigationAction, originKey?: string) => HandleActionResult;
  getStateForKey: (key: string) => NavigationState | undefined;
  addListener?: AddListener;
  addKeyedListener?: AddKeyedListener;
  onDispatchAction: (action: NavigationAction, noop: boolean) => void;
  onOptionsChange: (options: object) => void;
  stackRef?: React.MutableRefObject<string | undefined>;
}>({
  handleAction: () => ({ handled: false }),
  getStateForKey: () => undefined,
  onDispatchAction: () => undefined,
  onOptionsChange: () => undefined,
});
