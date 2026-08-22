import { store, type ReactNavigationState } from '../../global-state/router-store';
import { findDivergentState } from '../../global-state/routing';
import { removeInternalExpoRouterParams } from '../../navigationParams';
import type {
  ParamListBase,
  NavigationRoute,
  NavigationState,
  PartialState,
  TabNavigationState,
} from '../../react-navigation/native';
import type { Href } from '../../types';
import { resolveHref } from '../href';
import type { TabPath } from './native';

export function getTabPathFromRootStateByHref(
  href: Href,
  rootState: ReactNavigationState
): TabPath[] {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return [];
  }
  // Replicating the logic from `linkTo`
  const { navigationRoutes } = findDivergentState(hrefState, state as NavigationState, true);

  if (!navigationRoutes.length) {
    return [];
  }

  const tabPath: TabPath[] = [];
  navigationRoutes.forEach((route, i, arr) => {
    // TODO(ENG-22021): Fix link preview by detecting navigator type on native. https://linear.app/expo/issue/ENG-22021/fix-link-preview-by-detecting-navigator-type-on-native
    if (route.state?.type === 'tab') {
      const tabState = route.state as TabNavigationState<ParamListBase>;
      const oldTabKey = tabState.routes[tabState.index]!.key;
      // The next route will be either stack inside a tab or a new tab key
      if (!arr[i + 1]) {
        throw new Error(
          `New tab route is missing for ${route.key}. This is likely an internal Expo Router bug.`
        );
      }
      const newTabKey = arr[i + 1]!.key;
      tabPath.push({ oldTabKey, newTabKey });
    }
  });
  return tabPath;
}

export function getPreloadedRouteFromRootStateByHref(
  href: Href,
  rootState: ReactNavigationState
): NavigationRoute<ParamListBase, string> | undefined {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return undefined;
  }
  return findPreloadedRoute(hrefState, state as NavigationState);
}

// TODO(@ubax):Try to simplify this logic and move it to native if possible
// ENG-22021
function findPreloadedRoute(
  targetState: PartialState<NavigationState>,
  navigationState: NavigationState
): NavigationRoute<ParamListBase, string> | undefined {
  const targetRoute = targetState.routes[targetState.index ?? targetState.routes.length - 1];
  if (!targetRoute) {
    return undefined;
  }

  // We can safely check for type here, since we are looking for preloaded route
  // In order to create a preloaded route, an action needs to be dispatched, so type
  // will be defined
  if (navigationState.type === 'stack') {
    const focusedRoute = navigationState.routes[navigationState.index]!;
    const preloadedRoute = navigationState.routes
      .slice(navigationState.index + 1)
      .find((route) => routesHaveSameShape(route, targetRoute));
    if (preloadedRoute) {
      // A focused route with the same shape means the destination is already active.
      return routesHaveSameShape(focusedRoute, targetRoute) ? undefined : preloadedRoute;
    }
  }

  // TODO(ENG-22021): Resolve navigator types independently of state for the tab checks in this loop.
  // https://linear.app/expo/issue/ENG-22021/fix-link-preview-by-detecting-navigator-type-on-native
  const navigationRoute =
    navigationState.type === 'tab'
      ? navigationState.routes.find((route) => route.name === targetRoute.name)
      : navigationState.routes[navigationState.index ?? 0];

  return targetRoute.state && navigationRoute?.name === targetRoute.name && navigationRoute.state
    ? findPreloadedRoute(targetRoute.state, navigationRoute.state as NavigationState)
    : undefined;
}

function routesHaveSameShape(
  route: NavigationState['routes'][number] | PartialState<NavigationState>['routes'][number],
  targetRoute: PartialState<NavigationState>['routes'][number]
): boolean {
  if (
    route.name !== targetRoute.name ||
    !deepEqual(
      removeInternalExpoRouterParams(route.params ?? {}),
      removeInternalExpoRouterParams(targetRoute.params ?? {})
    )
  ) {
    return false;
  }

  if (!route.state || !targetRoute.state) {
    return route.state === targetRoute.state;
  }

  const routeState = route.state;
  return (
    (routeState.index ?? routeState.routes.length - 1) ===
      (targetRoute.state.index ?? targetRoute.state.routes.length - 1) &&
    routeState.routes.length === targetRoute.state.routes.length &&
    routeState.routes.every((childRoute, index) =>
      routesHaveSameShape(childRoute, targetRoute.state!.routes[index]!)
    )
  );
}

export function deepEqual(
  a: { [key: string]: any } | undefined,
  b: { [key: string]: any } | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => deepEqual(a[key], b[key]));
}
