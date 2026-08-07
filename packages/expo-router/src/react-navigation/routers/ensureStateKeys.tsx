import { nanoid } from 'nanoid/non-secure';

import type { KeyedPartialState, NavigationState, PartialState } from './types';

export function ensureStateKeys<State extends NavigationState>(
  state: State | PartialState<State>,
  navigatorType?: string
): State | KeyedPartialState<State> {
  let routesChanged = false;
  const routes = state.routes.map((route) => {
    const nestedState = route.state ? ensureStateKeys(route.state) : undefined;
    const key = route.key ?? `${route.name}-${nanoid()}`;

    if (key === route.key && nestedState === route.state) {
      return route;
    }

    routesChanged = true;
    return nestedState === undefined ? { ...route, key } : { ...route, key, state: nestedState };
  });
  const key = state.key ?? `${state.type ?? navigatorType ?? 'navigation'}-${nanoid()}`;

  if (key === state.key && !routesChanged) {
    // The recursive checks above establish the required keys on stale states.
    return state as State | KeyedPartialState<State>;
  }

  // `key` and every route key are assigned above, including nested stale states.
  return { ...state, key, routes } as State | KeyedPartialState<State>;
}
