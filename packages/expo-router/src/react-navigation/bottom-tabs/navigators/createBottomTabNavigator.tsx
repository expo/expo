'use client';
import * as React from 'react';

import { useOptionalContextKey } from '../../../Route';
import { NavigatorTypeContext } from '../../core/NavigatorTypeContext';
import {
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StaticConfig,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../native';
import { getBackStackAnchorName } from '../../routers/TabRouter';
import { usePreloadRoutes } from '../../usePreloadRoutes';
import { useTabPlaceholders } from '../../useTabPlaceholders';
import type {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
  BottomTabNavigatorProps,
} from '../types';
import { BottomTabView } from '../views/BottomTabView';

function BottomTabNavigator({
  id,
  initialRouteName,
  backBehavior,
  UNSTABLE_routeNamesChangeBehavior,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: BottomTabNavigatorProps) {
  const { state, descriptors, navigation, describe, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    BottomTabNavigationOptions,
    BottomTabNavigationEventMap
  >(TabRouter, {
    id,
    initialRouteName,
    backBehavior,
    UNSTABLE_routeNamesChangeBehavior,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  // Key placeholders with the same pathname the router keys real routes with, so the real route
  // reconciles onto its placeholder instead of remounting.
  const pathname = useOptionalContextKey();
  const [tabState, tabDescriptors] = useTabPlaceholders(
    state,
    descriptors,
    describe,
    pathname,
    state.routeNames
  );

  // Bottom tabs default to `lazy` (rendered on first access), so only routes that opt out with
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
  // Keep the implicit back-stack anchor loaded too (deep links only materialize anchors declared
  // in the linking config).
  const routeNamesToPreload = React.useMemo(() => {
    const anchorName = getBackStackAnchorName(state.routeNames, backBehavior, initialRouteName);
    if (anchorName && !nonLazyRouteNames.includes(anchorName)) {
      return [...nonLazyRouteNames, anchorName];
    }
    return nonLazyRouteNames;
  }, [state.routeNames, nonLazyRouteNames, backBehavior, initialRouteName]);
  usePreloadRoutes(state, navigation, routeNamesToPreload);

  return (
    <NavigatorTypeContext value="tab">
      <NavigationContent>
        <BottomTabView
          {...rest}
          state={tabState}
          navigation={navigation}
          descriptors={tabDescriptors}
        />
      </NavigationContent>
    </NavigatorTypeContext>
  );
}

export function createBottomTabNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: BottomTabNavigationOptions;
    EventMap: BottomTabNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof BottomTabNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(BottomTabNavigator)(config);
}
