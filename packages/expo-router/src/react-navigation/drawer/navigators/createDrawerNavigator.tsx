'use client';
import * as React from 'react';

import {
  NavigatorTypeContext,
  useNavigatorTypeContextValue,
} from '../../core/NavigatorTypeContext';
import {
  createNavigatorFactory,
  type DrawerActionHelpers,
  type DrawerNavigationState,
  DrawerRouter,
  type DrawerRouterOptions,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StaticConfig,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../native';
import { getBackStackAnchorName } from '../../routers/TabRouter';
import { usePreloadAnchor } from '../../usePreloadAnchor';
import { usePreloadRoutes } from '../../usePreloadRoutes';
import { useTabPlaceholders } from '../../useTabPlaceholders';
import type {
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
  DrawerNavigationProp,
  DrawerNavigatorProps,
} from '../types';
import { DrawerView } from '../views/DrawerView';

function DrawerNavigator({
  id,
  initialRouteName,
  defaultStatus = 'closed',
  backBehavior,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: DrawerNavigatorProps) {
  const { state, descriptors, navigation, describe, NavigationContent } = useNavigationBuilder<
    DrawerNavigationState<ParamListBase>,
    DrawerRouterOptions,
    DrawerActionHelpers<ParamListBase>,
    DrawerNavigationOptions,
    DrawerNavigationEventMap
  >(DrawerRouter, {
    id,
    initialRouteName,
    defaultStatus,
    backBehavior,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  // Placeholders reuse the key the router will assign (derived from `state.key`), so the real route
  // reconciles onto its placeholder instead of remounting.
  const [tabState, tabDescriptors] = useTabPlaceholders(
    state,
    descriptors,
    describe,
    state.routeNames
  );

  // Drawer screens default to `lazy` (rendered on first access), so only routes that opt out with
  // `lazy={false}` are preloaded. `lazy` is read from the augmented descriptors so it is available
  // for routes that haven't materialized yet.
  const nonLazyRouteNames = React.useMemo(
    () =>
      state.routeNames.filter((name) => {
        const placeholder = tabState.routes.find((route) => route.name === name);
        return placeholder ? tabDescriptors[placeholder.key]?.options.lazy === false : false;
      }),
    [state.routeNames, tabState.routes, tabDescriptors]
  );
  // Keep the implicit back-stack anchor loaded at the FRONT of the routes so a deep link to a
  // non-anchor screen still goes back to it (deep links only materialize anchors declared in the
  // linking config). The anchor is excluded from the plain preload list below so `FRONT_PRELOAD`
  // (front) and `PRELOAD` (tail) don't race for the same route.
  const anchorName = getBackStackAnchorName(state.routeNames, backBehavior, initialRouteName);
  const nonAnchorRouteNames = React.useMemo(
    () => nonLazyRouteNames.filter((name) => name !== anchorName),
    [nonLazyRouteNames, anchorName]
  );
  // The compiled href per route is attached to its (placeholder or real) descriptor options by
  // `DrawerClient`, so a preload carries the route's full subtree instead of a bare route.
  const resolveHref = React.useCallback(
    (name: string) => {
      const route = tabState.routes.find((candidate) => candidate.name === name);
      return route ? tabDescriptors[route.key]?.options.unstable_preloadHref : undefined;
    },
    [tabState, tabDescriptors]
  );
  usePreloadRoutes(state, navigation, nonAnchorRouteNames, resolveHref);
  usePreloadAnchor(state, navigation, backBehavior, initialRouteName, resolveHref);

  const navigatorTypeValue = useNavigatorTypeContextValue('drawer', state.key);

  return (
    <NavigatorTypeContext value={navigatorTypeValue}>
      <NavigationContent>
        <DrawerView
          {...rest}
          defaultStatus={defaultStatus}
          state={tabState}
          descriptors={tabDescriptors}
          navigation={navigation}
        />
      </NavigationContent>
    </NavigatorTypeContext>
  );
}

export function createDrawerNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: DrawerNavigationState<ParamList>;
    ScreenOptions: DrawerNavigationOptions;
    EventMap: DrawerNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: DrawerNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof DrawerNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(DrawerNavigator)(config);
}
