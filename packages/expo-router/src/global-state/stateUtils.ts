import type { CompleteResultState } from '../fork/getStateFromPath';
import { matchDynamicName } from '../matchers';
import type { PartialRoute, NavigationState, PartialState } from '../react-navigation/native';
import { getNextRouteKeyFromState, getRouteKey } from '../react-navigation/routers/getRouteKey';

/**
 * React Navigation uses params to store information about the screens, rather then create new state for each level.
 * This function traverses the action state that will not be part of state and returns a payload that can be used in action.
 */
export function getPayloadFromStateRoute(_actionStateRoute: PartialRoute<any>) {
  const rootPayload: Record<string, any> = { params: {} };
  let payload = rootPayload;
  let params = payload.params;
  let actionStateRoute: PartialRoute<any> | undefined = _actionStateRoute;

  while (actionStateRoute) {
    Object.assign(params, { ...payload.params, ...actionStateRoute.params });
    // Assign the screen name to the payload
    payload.screen = actionStateRoute.name;
    // Merge the params, ensuring that we create a new object
    payload.params = { ...params };

    // Params don't include the screen, thats a separate attribute
    delete payload.params['screen'];

    // Continue down the payload tree
    // Initially these values are separate, but React Nav merges them after the first layer
    payload = payload.params;
    params = payload;

    actionStateRoute = actionStateRoute.state?.routes[actionStateRoute.state?.routes.length - 1];
  }
  return rootPayload;
}

type NavigationPayload = {
  name?: string;
  params?: Record<string, unknown>;
  state?: NavigationState | PartialState<NavigationState>;
};

type NavigationPayloadRoute = Omit<PartialRoute<any>, 'state'> & {
  state?: NavigationState | PartialState<NavigationState>;
};

export function getNavigationPayloadFromStateRoute(
  actionStateRoute: NavigationPayloadRoute | undefined,
  navigationState: NavigationState,
  extraParams?: Record<string, unknown>
): NavigationPayload {
  const name = actionStateRoute?.name;
  const params = getRouteParams(actionStateRoute?.params, extraParams);

  if (!name) {
    return { name, params };
  }

  const routeKey = getNextRouteKeyFromState({
    stateKey: navigationState.key,
    name,
    state: navigationState,
  });
  const state = actionStateRoute?.state
    ? rekeyState(actionStateRoute.state, routeKey, params)
    : undefined;

  return { name, params, state };
}

function getRouteParams(
  params: PartialRoute<any>['params'],
  extraParams?: Record<string, unknown>
): Record<string, unknown> | undefined {
  const result = params ? { ...(params as Record<string, unknown>) } : {};
  delete result.screen;
  delete result.initial;
  delete result.params;
  return { ...result, ...extraParams };
}

function rekeyState(
  state: NavigationState | PartialState<NavigationState>,
  stateKey: string,
  inheritedParams?: Record<string, unknown>
): NavigationState | PartialState<NavigationState> {
  const routeNameCounts = new Map<string, number>();

  return {
    ...state,
    key: stateKey,
    routes: state.routes.map((route, routeIndex) => {
      const index = routeNameCounts.get(route.name) ?? 0;
      routeNameCounts.set(route.name, index + 1);
      const key = getRouteKey({ stateKey, name: route.name, index });
      const isFocusedPathRoute = routeIndex === state.routes.length - 1;
      const routeParams = getMergedParams(
        isFocusedPathRoute ? inheritedParams : undefined,
        route.params
      );
      const { path, ...routeWithoutPath } = route;
      void path;

      const nextRoute = {
        ...routeWithoutPath,
        key,
        path: undefined,
        params: routeParams,
      };

      if (route.state) {
        return { ...nextRoute, state: rekeyState(route.state, key, routeParams) };
      }

      return nextRoute;
    }),
  } as NavigationState | PartialState<NavigationState>;
}

function getMergedParams(
  inheritedParams: Record<string, unknown> | undefined,
  params: PartialRoute<any>['params']
): Record<string, unknown> | undefined {
  const routeParams = getRouteParams(params);
  const shouldKeepParams = inheritedParams !== undefined || params !== undefined;

  if (!shouldKeepParams) {
    return undefined;
  }

  return { ...inheritedParams, ...routeParams };
}

/**
 * Traverse the state tree comparing the current state and the action state until we find where they diverge.
 *
 * @returns An object with:
 *  - `actionState` — the remaining action state at the point of divergence
 *  - `navigationState` — the navigator that should be targeted for the dispatched action
 *  - `actionStateRoute` — the specific route in the action state where divergence was detected
 *  - `navigationRoutes` — navigation routes that matched before divergence (used for tab targeting)
 *
 * @private
 */
export function findDivergentState(
  // Production passes the compiler's complete state; tests pass hand-built partial states.
  _actionState: CompleteResultState | PartialState<NavigationState>,
  _navigationState: NavigationState,
  // State keys of tab navigators to look through (compare every route, not just the focused one).
  // These are the tab navigators that are React ancestors of the preview link, captured from
  // `NavigatorTypeContext`. A nested tab that is not such an ancestor (deeper in the target subtree)
  // is no longer looked through — that case is superseded by Step 4's payload subtrees.
  tabNavigatorKeys?: ReadonlySet<string>
) {
  // The compiler now yields complete states (`stale: false`); this traversal only reads them, so
  // view it through the partial shape the loop already expects.
  let actionState: PartialState<NavigationState> | undefined = _actionState as unknown as
    | PartialState<NavigationState>
    | undefined;
  let navigationState: NavigationState | undefined = _navigationState;
  let actionStateRoute: PartialRoute<any> | undefined;
  const navigationRoutes = [];
  while (actionState && navigationState) {
    // TODO(@kitten): Review invalid indexed access into undefined
    actionStateRoute = actionState.routes[actionState.routes.length - 1]!;
    const lookThroughTabs = tabNavigatorKeys?.has(navigationState.key) ?? false;
    const stateRoute = lookThroughTabs
      ? navigationState.routes.find((route) => route.name === actionStateRoute?.name) ||
        navigationState.routes[navigationState.index ?? 0]!
      : navigationState.routes[navigationState.index ?? 0]!;

    const childState: PartialState<NavigationState> | undefined = actionStateRoute.state;
    const nextNavigationState = stateRoute.state;

    const dynamicName = matchDynamicName(actionStateRoute!.name);

    const didActionAndCurrentStateDiverge =
      actionStateRoute.name !== stateRoute.name ||
      !childState ||
      !nextNavigationState ||
      (dynamicName &&
        actionStateRoute.params?.[dynamicName.name] !==
          (stateRoute.params as Record<string, any> | undefined)?.[dynamicName.name]);

    if (didActionAndCurrentStateDiverge) {
      // When looking through a tab navigator, push the diverging tab route so callers can switch to
      // the target tab (otherwise there would be no record of which tab to select).
      if (lookThroughTabs) {
        navigationRoutes.push(stateRoute);
      }
      break;
    }

    navigationRoutes.push(stateRoute);

    actionState = childState;
    navigationState = nextNavigationState as NavigationState;
  }

  return {
    actionState,
    navigationState,
    actionStateRoute,
    navigationRoutes,
  };
}
