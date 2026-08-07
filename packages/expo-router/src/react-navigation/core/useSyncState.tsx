'use client';
import * as React from 'react';

import { deepFreeze } from './deepFreeze';

const createStore = <T,>(getInitialState: () => T) => {
  const listeners: (() => void)[] = [];

  let initialized = false;
  let state: T;

  const getState = () => {
    if (initialized) {
      return state;
    }

    initialized = true;
    state = deepFreeze(getInitialState());

    return state;
  };

  const setState = (newState: T) => {
    state = deepFreeze(newState);
    listeners.forEach((listener) => listener());
  };

  const subscribe = (callback: () => void) => {
    listeners.push(callback);

    return () => {
      const index = listeners.indexOf(callback);

      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  return {
    getState,
    setState,
    subscribe,
  };
};

export function useSyncState<T>(getInitialState: () => T) {
  const store = React.useRef(createStore(getInitialState)).current;

  const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState);

  React.useDebugValue(state);

  return {
    state,
    getState: store.getState,
    setState: store.setState,
  } as const;
}
