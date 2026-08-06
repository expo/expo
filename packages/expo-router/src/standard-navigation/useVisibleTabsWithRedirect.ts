import { useEffect, useMemo } from 'react';

import { useRouteNode } from '../Route';
import { router } from '../imperative-api';
import { normalizeRouteName, useGuardRedirect } from '../layouts/GuardContext';
import {
  type Descriptor,
  type ParamListBase,
  type RouteProp,
  useIsFocused,
} from '../react-navigation/native';
import { orderRoutesByRouteNames } from '../utils/orderRoutesByRouteNames';
import type { StandardNavigatorDescriptor } from './types';
import { useBuildHref } from './useBuildHref';

export type TabRoute = RouteProp<ParamListBase, string>;

export type TabDescriptor<Options extends object> = Partial<
  Pick<StandardNavigatorDescriptor<Options>, 'routeSource' | 'options' | 'render'> &
    Pick<Descriptor<Options, never, RouteProp<ParamListBase, string>>, 'route'>
>;

/**
 * Returns the visible layout tabs and their focused index. When the navigator is focused, redirects
 * an unavailable focused route to the layout's initial route or the first visible tab.
 */
export function useVisibleTabsWithRedirect<
  Route extends TabRoute,
  Options extends { hidden?: boolean },
>({
  routes,
  routeNames,
  focusedRouteKey,
  descriptors,
}: {
  routes: Route[];
  routeNames: string[];
  focusedRouteKey: string | undefined;
  descriptors: Record<string, TabDescriptor<Options>>;
}) {
  const buildHref = useBuildHref();
  const isFocused = useIsFocused();
  const routeNode = useRouteNode();
  const focusedRoute = routes.find((route) => route.key === focusedRouteKey);
  const guardRedirect = useGuardRedirect(focusedRoute?.name ?? '');

  const visibleRoutes = useMemo(
    () =>
      orderRoutesByRouteNames(routes, routeNames).filter((route) => {
        // Every filesystem route is registered in state; only routes declared by a non-hidden
        // trigger become tab items.
        const descriptor = descriptors[route.key];
        return isDeclaredInLayout(descriptor) && descriptor?.options?.hidden !== true;
      }),
    [routes, routeNames, descriptors]
  );
  const visibleFocusedIndex = useMemo(
    () => visibleRoutes.findIndex((route) => route.key === focusedRouteKey),
    [focusedRouteKey, visibleRoutes]
  );
  const focusedIndex = visibleFocusedIndex;

  const redirectHref = useMemo(() => {
    if (guardRedirect !== undefined) {
      return guardRedirect;
    }
    const redirectRoute =
      findRouteByName(visibleRoutes, routeNode?.initialRouteName) ?? visibleRoutes[0];
    if (redirectRoute) {
      return buildHref(redirectRoute);
    }
    return null;
  }, [buildHref, guardRedirect, routeNode?.initialRouteName, visibleRoutes]);

  useEffect(() => {
    // TODO(@ubax): Consider throwing in __DEV__ instead of warning.
    if (__DEV__ && visibleRoutes.length === 0 && guardRedirect === undefined) {
      const undeclaredRoutes = routes
        .filter((route) => !isDeclaredInLayout(descriptors[route.key]))
        .map((route) => route.name)
        .join(', ');
      console.warn(
        `No screens are declared in ${routeNode?.contextKey ?? 'the layout'}, so the navigator renders nothing. ` +
          'Only screens declared in the layout become visible. ' +
          'Declare each screen you want to show, for example <Tabs.Screen name="index" /> or <NativeTabs.Trigger name="index" />. ' +
          `Undeclared routes: ${undeclaredRoutes}.`
      );
    }
    // Route names are diagnostic; only rerun when the warning's eligibility changes.
  }, [guardRedirect, routeNode?.contextKey, visibleRoutes.length]);

  useEffect(() => {
    // The focused route can be hidden or have no trigger at all — for example a path pointing at a
    // route without a tab, or a trigger hidden while focused. Redirect to the router's initial tab,
    // falling back to the first visible tab. `replace` keeps the unreachable route out of history.
    // TODO(@ubax): Show a formsheet for hidden tabs which are focused (Tabs + Stack in one).
    if (isFocused && visibleFocusedIndex < 0 && redirectHref != null) {
      router.replace(redirectHref);
    }
  }, [isFocused, redirectHref, visibleFocusedIndex]);

  return { visibleRoutes, focusedIndex };
}

function isDeclaredInLayout<Options extends object>(
  descriptor: TabDescriptor<Options> | undefined
): boolean {
  return descriptor?.routeSource === 'layout';
}

function findRouteByName<Route extends TabRoute>(routes: Route[], name: string | undefined) {
  return routes.find((route) => route.name === name || normalizeRouteName(route.name) === name);
}
