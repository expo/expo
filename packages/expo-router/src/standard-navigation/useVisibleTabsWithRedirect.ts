import { use, useEffect, useMemo } from 'react';

import { useRouteNode } from '../Route';
import { NOT_FOUND_ROUTE_NAME } from '../constants';
import { getGuard } from '../global-state/guards';
import { useEnqueueRoutingIntent } from '../global-state/routingQueueContext';
import { findStateByKey } from '../global-state/stateUtils';
import { GuardContext } from '../layouts/GuardContext';
import { useIsPreview } from '../link/preview/PreviewRouteContext';
import { NavigationBuilderContext } from '../react-navigation/core/NavigationBuilderContext';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import {
  type Descriptor,
  type ParamListBase,
  type RouteProp,
  useIsFocused,
} from '../react-navigation/native';
import { TabActions } from '../react-navigation/routers/TabRouter';
import { getValidInitialRouteName } from '../routeNode';
import { orderRoutesByRouteNames } from '../utils/orderRoutesByRouteNames';
import type { StandardNavigatorDescriptor } from './types';

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
  navigatorKey,
}: {
  routes: Route[];
  routeNames: string[];
  focusedRouteKey: string | undefined;
  descriptors: Record<string, TabDescriptor<Options>>;
  navigatorKey?: string;
}) {
  const { handleGuardsChanged } = use(NavigationBuilderContext);
  const enqueue = useEnqueueRoutingIntent();
  const navigatorState = use(NavigatorStateContext);
  const key = navigatorKey ?? navigatorState?.key;
  const isPreview = useIsPreview();
  const isFocused = useIsFocused();
  const routeNode = useRouteNode();
  const focusedRoute = routes.find((route) => route.key === focusedRouteKey);
  const guards = use(GuardContext);
  const hasGuards = !!guards?.size;
  const isFocusedRouteGuarded =
    !!guards && !!focusedRoute && getGuard(guards, focusedRoute.name) !== undefined;

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
  const focusedFallbackRoute =
    visibleFocusedIndex < 0 && focusedRoute?.name === NOT_FOUND_ROUTE_NAME
      ? focusedRoute
      : undefined;
  // TODO(@ubax): https://github.com/expo/expo/pull/48618#discussion_r3735996409
  const focusedIndex = visibleFocusedIndex;

  const initialRouteName = getValidInitialRouteName(routeNode);

  const redirectRoute =
    visibleRoutes.find((route) => route.name === initialRouteName) ?? visibleRoutes[0];

  useEffect(() => {
    // TODO(@ubax): Consider throwing in __DEV__ instead of warning.
    // TODO: Skip this during HMR while placeholder descriptors lack `routeSource`.
    if (__DEV__ && visibleRoutes.length === 0 && !isFocusedRouteGuarded) {
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
  }, [isFocusedRouteGuarded, routeNode?.contextKey, visibleRoutes.length]);

  useEffect(() => {
    if (isPreview || !isFocused || visibleFocusedIndex >= 0 || focusedFallbackRoute) {
      return;
    }
    if (!redirectRoute) {
      // The guard policy cannot see which tabs are visible, so it learns here that no tab is
      // visible, and then looks for a fallback in a parent.
      if (hasGuards && key) {
        handleGuardsChanged(key);
      }
      return;
    }
    // The focused route can be hidden or have no trigger at all — for example a path pointing at a
    // route without a tab, or a trigger hidden while focused. Redirect to the router's initial tab,
    // falling back to the first visible tab. `replace` keeps the unreachable route out of history.
    // TODO(@ubax): Show a formsheet for hidden tabs which are focused (Tabs + Stack in one).
    enqueue({
      type: 'COMPUTED_ACTION',
      payload: {
        compute: (rootState, registry) => {
          // A guard `redirectTo` or an unmount can change the focus before this runs.
          const tabState = key && registry.has(key) ? findStateByKey(rootState, key) : undefined;
          return tabState?.routes[tabState.index]?.key === focusedRouteKey
            ? { ...TabActions.replace(redirectRoute.name, redirectRoute.params), target: key }
            : undefined;
        },
        originKey: key,
      },
    });
  }, [
    enqueue,
    focusedFallbackRoute,
    focusedRouteKey,
    handleGuardsChanged,
    hasGuards,
    isFocused,
    isPreview,
    key,
    redirectRoute,
    visibleFocusedIndex,
  ]);

  return { visibleRoutes, focusedIndex, focusedFallbackRoute };
}

function isDeclaredInLayout<Options extends object>(
  descriptor: TabDescriptor<Options> | undefined
): boolean {
  return descriptor?.routeSource === 'layout';
}
