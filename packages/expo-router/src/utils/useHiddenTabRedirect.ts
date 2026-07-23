import { useEffect, useMemo } from 'react';

import { router } from '../imperative-api';
import {
  type NavigationRoute,
  type ParamListBase,
  type RouteSource,
  useIsFocused,
} from '../react-navigation/native';
import { useBuildHref } from '../standard-navigation/useBuildHref';

type TabRoute = NavigationRoute<ParamListBase, string> & { href?: string };

type TabDescriptor = {
  routeSource?: RouteSource;
  options?: object;
};

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
        const isHidden =
          descriptor?.options &&
          'hidden' in descriptor.options &&
          descriptor.options.hidden === true;
        return descriptor?.routeSource === 'layout' && !isHidden;
      }),
    [routes, descriptors]
  );
  const visibleFocusedIndex = useMemo(
    () => visibleRoutes.findIndex((route) => route.key === focusedRouteKey),
    [focusedRouteKey, visibleRoutes]
  );
  const redirectHref = useMemo(() => {
    const redirectRoute =
      visibleRoutes.find(
        (route) =>
          route.name === redirectToRouteName ||
          route.name.replace(/\/index$/, '') === redirectToRouteName
      ) ?? visibleRoutes[0];
    return redirectRoute && (redirectRoute.href ?? buildHref(redirectRoute));
  }, [buildHref, redirectToRouteName, visibleRoutes]);

  useEffect(() => {
    if (isFocused && visibleFocusedIndex < 0 && redirectHref != null) {
      router.replace(redirectHref);
    }
  }, [isFocused, redirectHref, visibleFocusedIndex]);

  return { visibleRoutes, visibleFocusedIndex };
}
