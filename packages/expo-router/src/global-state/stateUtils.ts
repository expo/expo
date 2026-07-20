import type { CompleteResultState } from '../fork/getStateFromPath';
import { matchDynamicName } from '../matchers';
import type {
  PartialRoute,
  NavigationState,
  PartialState,
  Route,
} from '../react-navigation/native';
import { getNextRouteKeyFromState, getRouteKey } from '../react-navigation/routers/getRouteKey';

type AnyPartialRoute = Partial<PartialRoute<Route<string>>>;

type NavigationPayload = {
  name?: string;
  params?: Record<string, unknown>;
  state?: NavigationState | PartialState<NavigationState>;
};

type NavigationPayloadRoute = Omit<AnyPartialRoute, 'state'> & {
  state?: NavigationState | PartialState<NavigationState>;
};

export function getNavigationPayloadFromStateRoute(
  actionStateRoute: NavigationPayloadRoute | undefined,
  navigationState: NavigationState,
  extraParams?: Record<string, unknown>,
  // A navigate (unlike a push) that lands on a route already present in the target navigator reuses
  // that route rather than appending a new one — e.g. switching to a sibling tab. The subtree must
  // then adopt the existing route's key so the installed slice keys the same as the live navigator;
  // minting a fresh index instead would key a differently-identified subtree over a preloaded tab
  // and remount its screens. A push always appends, so it keeps minting the next key.
  reuseExistingRoute?: boolean
): NavigationPayload {
  const name = actionStateRoute?.name;
  const params = getRouteParams(actionStateRoute?.params, extraParams);

  if (!name) {
    return { name, params };
  }

  const existingRoute = reuseExistingRoute
    ? navigationState.routes.find((route) => route.name === name)
    : undefined;
  const routeKey =
    existingRoute?.key ??
    getNextRouteKeyFromState({
      stateKey: navigationState.key,
      name,
      state: navigationState,
    });
  const state = actionStateRoute?.state
    ? rekeyState(actionStateRoute.state, routeKey, params)
    : undefined;

  return { name, params, state };
}

// Reduces a compiled subtree to just its focused path, dropping any materialized `initialRouteName`
// anchor at every level. A plain `push` must not load the anchor (`initial !== false`), and with the
// render-time param bridge gone the action itself has to carry the anchorless target subtree — the
// container installs it verbatim. Keys are preserved, so the installed slice needs no rehydration.
export function collapseToFocusedPath<T extends NavigationState | PartialState<NavigationState>>(
  state: T
): T {
  const index = state.index ?? state.routes.length - 1;
  const focusedRoute = state.routes[index];

  if (focusedRoute == null) {
    return state;
  }

  const nextFocused = focusedRoute.state
    ? { ...focusedRoute, state: collapseToFocusedPath(focusedRoute.state) }
    : focusedRoute;

  return { ...state, index: 0, routes: [nextFocused] };
}

function getRouteParams(
  params: AnyPartialRoute['params'],
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
      const nextRoute = {
        ...route,
        key,
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
  params: AnyPartialRoute['params']
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
  tabNavigatorKeys?: ReadonlySet<string>,
  // Reports whether a committed navigator currently has a mounted reducer. The committed state is
  // the seed and can contain a navigator that isn't mounted (e.g. a layout that renders `<Redirect>`
  // instead of its navigator). We must not descend past such a navigator: only a mounted navigator
  // can reduce an action, so we diverge at the nearest registered one and let the rest ride as
  // `payload.state`, which the container installs verbatim.
  isRegistered?: (key: string) => boolean
) {
  // The compiler now yields complete states (`stale: false`); this traversal only reads them, so
  // view it through the partial shape the loop already expects.
  let actionState: PartialState<NavigationState> | undefined = _actionState as unknown as
    | PartialState<NavigationState>
    | undefined;
  let navigationState: NavigationState | undefined = _navigationState;
  let actionStateRoute: AnyPartialRoute | undefined;
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

    const dynamicName =
      actionStateRoute?.name == null ? undefined : matchDynamicName(actionStateRoute.name);
    const actionStateRouteParams = actionStateRoute?.params as Record<string, unknown> | undefined;

    const didActionAndCurrentStateDiverge =
      actionStateRoute.name !== stateRoute.name ||
      !childState ||
      !nextNavigationState ||
      // The committed child navigator exists in state but isn't mounted, so it can't reduce — treat
      // it as the boundary and carry its subtree as `payload.state`.
      (isRegistered != null &&
        nextNavigationState.key != null &&
        !isRegistered(nextNavigationState.key)) ||
      (dynamicName &&
        actionStateRouteParams?.[dynamicName.name] !==
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
