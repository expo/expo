import { store, type ReactNavigationState } from '../../global-state/router-store';
import {
  findDivergentState,
  getNavigationPayloadFromStateRoute,
} from '../../global-state/stateUtils';
import { removeInternalExpoRouterParams } from '../../navigationParams';
import type {
  NavigationRoute,
  NavigationState,
  ParamListBase,
  TabNavigationState,
} from '../../react-navigation/native';
import type { Href } from '../../types';
import { resolveHref } from '../href';
import type { TabPath } from './native';

export function getTabPathFromRootStateByHref(
  href: Href,
  rootState: ReactNavigationState,
  tabNavigatorKeys: ReadonlySet<string>
): TabPath[] {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return [];
  }
  // Replicating the logic from `linkTo`
  const { navigationRoutes } = findDivergentState(
    hrefState,
    state as NavigationState,
    tabNavigatorKeys
  );

  if (!navigationRoutes.length) {
    return [];
  }

  const tabPath: TabPath[] = [];
  navigationRoutes.forEach((route, i, arr) => {
    // A navigation route is a tab level when its child navigator is one of the looked-through tabs.
    if (route.state?.key != null && tabNavigatorKeys.has(route.state.key)) {
      const tabState = route.state as TabNavigationState<ParamListBase>;
      const oldTabKey = tabState.routes[tabState.index]!.key;
      // The next route is the target tab route (a stack inside a tab or a new tab key).
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
  rootState: ReactNavigationState,
  tabNavigatorKeys: ReadonlySet<string>
): NavigationRoute<ParamListBase, string> | undefined {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return undefined;
  }
  // Replicating the logic from `linkTo`
  const { navigationState, actionStateRoute } = findDivergentState(
    hrefState,
    state as NavigationState,
    tabNavigatorKeys
  );

  if (!navigationState || !actionStateRoute) {
    return undefined;
  }

  // No navigator-kind check: this fork keeps no `preloadedRoutes` array, so preloaded (inactive)
  // routes are simply the `routes` tail after `index` — for every navigator kind. Tab and drawer
  // navigators keep their inactive items in the tail too, so unlike the old stack-only lookup this
  // can intentionally match a preloaded tab route (e.g. previewing a sibling leaf tab).
  // Match against the preloaded route's own (clean) params — the same shape the `PRELOAD` action
  // now writes onto the route, since the legacy nested `screen`/`params` chain is gone.
  const payload = getNavigationPayloadFromStateRoute(actionStateRoute, navigationState);
  const index = navigationState.index ?? 0;

  const preloadedRoute = navigationState.routes
    .slice(index + 1)
    .find(
      (route) =>
        route.name === actionStateRoute.name &&
        deepEqual(
          removeInternalExpoRouterParams(route.params),
          removeInternalExpoRouterParams(payload.params)
        )
    );

  const activeRoute = navigationState.routes[index]!;
  // When the active route already matches the target, we should not navigate. This aligns with base
  // link behavior.
  if (
    activeRoute.name === preloadedRoute?.name &&
    deepEqual(
      // using ?? {}, because from our perspective undefined === {}, as both mean no params
      removeInternalExpoRouterParams(activeRoute.params ?? {}),
      removeInternalExpoRouterParams(payload.params ?? {})
    )
  ) {
    return undefined;
  }

  return preloadedRoute;
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
