import isEqual from 'react-fast-compare';

import type { NavigationState, PartialState, Route } from './types';

export type RouteState = (NavigationState | PartialState<NavigationState>) & {
  __internal__routerActionState?: true;
};

type StateAction = {
  payload?: object & { state?: RouteState | null };
};

/**
 * Attaches trusted nested state from a navigation action to a route and removes Expo Router's
 * internal state markers at every nested level. State without the internal
 * `__internal__routerActionState` marker is ignored and triggers a warning in development.
 *
 * @returns The original route object when the action has no state, the state lacks the marker,
 * or the state after removing markers is deeply equal to the route's existing state. Otherwise,
 * returns a new route object with the nested state attached, without mutating the original route
 * or action.
 *
 * @example
 * ```ts
 * // Inside a custom router's action handler, preserve nested state from the incoming action.
 * const route = attachRouteState(
 *   {
 *     key: nextKey(action.payload.name),
 *     name: action.payload.name,
 *     params: action.payload.params,
 *   },
 *   action
 * );
 * ```
 *
 * @experimental
 */
export function attachRouteState<T extends Route<string> & { state?: RouteState }>(
  route: T,
  action: StateAction
): T {
  const state = action.payload?.state;
  if (state == null) {
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

  // The marker proves the action's origin; it must not persist in navigation state.
  const nextState = stripStateMarkers(state);

  if (route.state !== undefined) {
    if (isEqual(route.state, nextState)) {
      return route;
    }
  }

  return { ...route, state: nextState };
}

function stripStateMarkers<T extends NavigationState | PartialState<NavigationState>>(
  state: T
): Omit<T, '__internal__routerActionState'> {
  const { __internal__routerActionState, ...rest } = state as T & {
    __internal__routerActionState?: true;
  };
  // Rebuilding routes preserves the input navigation-state subtype while removing its marker.
  return {
    ...rest,
    routes: state.routes.map((route) =>
      route.state === undefined ? route : { ...route, state: stripStateMarkers(route.state) }
    ),
  } as Omit<T, '__internal__routerActionState'>;
}
