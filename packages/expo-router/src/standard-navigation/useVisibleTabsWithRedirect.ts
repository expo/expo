import { useEffect, useMemo } from 'react';

import { router } from '../imperative-api';
import {
  type NavigationRoute,
  type ParamListBase,
  type RouteSource,
  useIsFocused,
} from '../react-navigation/native';
import { useBuildHref } from './useBuildHref';

type TabRoute = NavigationRoute<ParamListBase, string>;

type TabDescriptor<Options extends object> = {
  routeSource?: RouteSource;
  options?: Options;
};

/**
 * Returns the visible layout tabs and their focused index. When the navigator is focused, redirects
 * an unavailable focused route to `redirectToRouteName` or the first visible tab.
 */
export function useVisibleTabsWithRedirect<Route extends TabRoute, Options extends object>({
  routes,
  focusedRouteKey,
  descriptors,
  redirectToRouteName,
  isHidden,
}: {
  routes: Route[];
  focusedRouteKey: string;
  descriptors: Record<string, TabDescriptor<Options>>;
  redirectToRouteName?: string;
  // Keep this callback reference-stable to avoid recalculating the visible routes.
  isHidden?: (options: Options | undefined) => boolean;
}) {
  const buildHref = useBuildHref();
  const isFocused = useIsFocused();

  const visibleRoutes = useMemo(
    () =>
      routes.filter((route) => {
        // Every filesystem route is registered in state; only routes declared by a non-hidden
        // trigger become tab items.
        const descriptor = descriptors[route.key];
        return isDeclaredInLayout(descriptor) && !isHidden?.(descriptor?.options);
      }),
    [routes, descriptors, isHidden]
  );
  const visibleFocusedIndex = useMemo(
    () => visibleRoutes.findIndex((route) => route.key === focusedRouteKey),
    [focusedRouteKey, visibleRoutes]
  );

  const redirectHref = useMemo(() => {
    const redirectRoute = findRouteByName(visibleRoutes, redirectToRouteName) ?? visibleRoutes[0];
    if (redirectRoute) {
      return buildHref(redirectRoute);
    }
    return null;
  }, [buildHref, redirectToRouteName, visibleRoutes]);

  useEffect(() => {
    // The focused route can be hidden or have no trigger at all — for example a path pointing at a
    // route without a tab, or a trigger hidden while focused. Redirect to the router's initial tab,
    // falling back to the first visible tab. `replace` keeps the unreachable route out of history.
    // TODO(@ubax): Show a formsheet for hidden tabs which are focused (Tabs + Stack in one).
    if (isFocused && visibleFocusedIndex < 0 && redirectHref != null) {
      router.replace(redirectHref);
    }
  }, [isFocused, redirectHref, visibleFocusedIndex]);

  return { visibleRoutes, visibleFocusedIndex };
}

function isDeclaredInLayout<Options extends object>(
  descriptor: TabDescriptor<Options> | undefined
): boolean {
  return descriptor?.routeSource === 'layout';
}

function findRouteByName<Route extends TabRoute>(routes: Route[], name: string | undefined) {
  return routes.find((route) => route.name === name || route.name.replace(/\/index$/, '') === name);
}
