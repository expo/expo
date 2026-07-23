import { useEffect, useMemo } from 'react';

import { router } from '../imperative-api';
import {
  type NavigationRoute,
  type ParamListBase,
  type RouteSource,
  useIsFocused,
} from '../react-navigation/native';
import { useBuildHref } from '../standard-navigation/useBuildHref';

type TabRoute = NavigationRoute<ParamListBase, string>;

type TabDescriptor = {
  routeSource?: RouteSource;
  options?: object;
};

/**
 * Redirects hidden tabs to `redirectToRouteName`
 */
export function useHiddenTabRedirect<Route extends TabRoute>({
  routes,
  focusedRouteKey,
  descriptors,
  redirectToRouteName,
}: {
  routes: Route[];
  focusedRouteKey: string;
  descriptors: Record<string, TabDescriptor>;
  redirectToRouteName?: string;
}) {
  const buildHref = useBuildHref();
  const isFocused = useIsFocused();

  const visibleRoutes = useMemo(
    () =>
      routes.filter((route) => {
        const descriptor = descriptors[route.key];
        return isDeclaredInLayout(descriptor) && !isHidden(descriptor);
      }),
    [routes, descriptors]
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

/** @internal Exported only for unit tests. */
export function isHidden(descriptor: TabDescriptor | undefined): boolean {
  return !!(
    descriptor?.options &&
    'hidden' in descriptor.options &&
    descriptor.options.hidden === true
  );
}

/** @internal Exported only for unit tests. */
export function isDeclaredInLayout(descriptor: TabDescriptor | undefined): boolean {
  return descriptor?.routeSource === 'layout';
}

/** @internal Exported only for unit tests. */
export function findRouteByName<Route extends TabRoute>(routes: Route[], name: string | undefined) {
  return routes.find((route) => route.name === name || route.name.replace(/\/index$/, '') === name);
}
