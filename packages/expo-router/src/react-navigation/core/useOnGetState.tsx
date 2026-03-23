import type { NavigationState } from '@react-navigation/routers';
import * as React from 'react';

import { isArrayEqual } from './isArrayEqual';
import {
  type GetStateListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';

type Options = {
  getState: () => NavigationState;
  getStateListeners: Record<string, GetStateListener | undefined>;
};

export function useOnGetState({ getState, getStateListeners }: Options) {
  const { addKeyedListener } = React.useContext(NavigationBuilderContext);
  const route = React.useContext(NavigationRouteContext);
  const key = route ? route.key : 'root';

  const getRehydratedState = React.useCallback(() => {
    const state = getState();

    // Avoid returning new route objects if we don't need to
    const routes = state.routes.map((route) => {
      const childState = getStateListeners[route.key]?.();

      if (route.state === childState) {
        return route;
      }

      return { ...route, state: childState };
    });

    if (isArrayEqual(state.routes, routes)) {
      return state;
    }

    return { ...state, routes };
  }, [getState, getStateListeners]);

  React.useEffect(() => {
    return addKeyedListener?.('getState', key, getRehydratedState);
  }, [addKeyedListener, getRehydratedState, key]);
}
