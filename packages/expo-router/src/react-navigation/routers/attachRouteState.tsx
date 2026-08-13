import isEqual from 'fast-deep-equal';

import type { NavigationState, PartialState, Route } from './types';

export type RouteState = (NavigationState | PartialState<NavigationState>) & {
  __internal__routerActionState?: true;
};

type StateAction = {
  payload?: object & { state?: RouteState };
};

export function attachRouteState<T extends Route<string> & { state?: RouteState }>(
  route: T,
  action: StateAction
): T {
  const state = action.payload?.state;
  if (state === undefined) {
    return route;
  }

  if (state.__internal__routerActionState !== true) {
    if (process.env.NODE_ENV !== 'production') {
      // TODO: Remove this warning once unmarked state-bearing actions are unsupported.
      console.warn(
        'A navigation action carried state without the internal __internal__routerActionState marker. The state was ignored because only Expo Router can safely generate navigation state. Use Expo Router navigation APIs instead of dispatching state-bearing actions directly.'
      );
    }
    return route;
  }

  if (route.state !== undefined) {
    if (isEqual(stripStateMarkers(route.state), stripStateMarkers(state))) {
      return route;
    }
  }

  return { ...route, state };
}

function stripStateMarkers(
  state: NavigationState | PartialState<NavigationState>
): Record<string, unknown> {
  const { __internal__routerActionState, ...rest } = state as RouteState;
  return {
    ...rest,
    routes: state.routes.map((route) =>
      route.state === undefined ? route : { ...route, state: stripStateMarkers(route.state) }
    ),
  };
}
