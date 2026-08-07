'use client';
import * as React from 'react';
import { use } from 'react';

import type { NavigationState } from '../routers';
import { type GetStateListener, NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';
import { isArrayEqual } from './isArrayEqual';
import { useClientLayoutEffect } from './useClientLayoutEffect';

type Options = {
  getState: () => NavigationState;
  getStateListeners: Record<string, GetStateListener | undefined>;
};

export function useOnGetState({ getState, getStateListeners }: Options) {
  const { addKeyedListener } = use(NavigationBuilderContext);
  const route = use(NavigationRouteContext);
  const key = route ? route.key : 'root';
  const cacheRef = React.useRef<
    | {
        state: NavigationState;
        childStates: (NavigationState | undefined)[];
        result: NavigationState;
      }
    | undefined
  >(undefined);

  const getRehydratedState = React.useCallback(() => {
    const state = getState();
    const childStates = state.routes.map((route) => getStateListeners[route.key]?.());
    const cached = cacheRef.current;
    if (
      cached?.state === state &&
      cached.childStates.length === childStates.length &&
      cached.childStates.every((childState, index) => childState === childStates[index])
    ) {
      return cached.result;
    }

    // Avoid returning new route objects if we don't need to
    const routes = state.routes.map((route, index) => {
      const childState = childStates[index];

      if (route.state === childState) {
        return route;
      }

      return { ...route, state: childState };
    });

    const result = isArrayEqual(state.routes, routes) ? state : { ...state, routes };
    cacheRef.current = { state, childStates, result };
    return result;
  }, [getState, getStateListeners]);

  useClientLayoutEffect(() => {
    return addKeyedListener?.('getState', key, getRehydratedState);
  }, [addKeyedListener, getRehydratedState, key]);
}
