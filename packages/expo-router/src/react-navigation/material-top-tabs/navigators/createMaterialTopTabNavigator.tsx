import { useCallback } from 'react';

import {
  NavigatorTypeContext,
  useNavigatorTypeContextValue,
} from '../../core/NavigatorTypeContext';
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
import { usePreloadRoutes } from '../../usePreloadRoutes';
import { useTabPlaceholders } from '../../useTabPlaceholders';
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
  MaterialTopTabNavigatorProps,
} from '../types';
import { MaterialTopTabView } from '../views/MaterialTopTabView';

function MaterialTopTabNavigator({
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
}: MaterialTopTabNavigatorProps) {
  const { state, descriptors, navigation, describe, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap
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

  // Placeholders reuse the key the router will assign (derived from `state.key`), so the real route
  // reconciles onto its placeholder instead of remounting.
  const [tabState, tabDescriptors] = useTabPlaceholders(
    state,
    descriptors,
    describe,
    state.routeNames
  );

  // The compiled href per route is attached to its (placeholder or real) descriptor options by
  // `TopTabsClient`, so a preload carries the route's full subtree instead of a bare route.
  const resolveHref = useCallback(
    (name: string) => {
      const route = tabState.routes.find((candidate) => candidate.name === name);
      return route ? tabDescriptors[route.key]?.options.unstable_preloadHref : undefined;
    },
    [tabState, tabDescriptors]
  );
  // Material top tabs stay fully eager: preload every declared route.
  usePreloadRoutes(state, navigation, state.routeNames, resolveHref);

  const navigatorTypeValue = useNavigatorTypeContextValue('tab', state.key);

  return (
    <NavigatorTypeContext value={navigatorTypeValue}>
      <NavigationContent>
        <MaterialTopTabView
          {...rest}
          state={tabState}
          navigation={navigation}
          descriptors={tabDescriptors}
        />
      </NavigationContent>
    </NavigatorTypeContext>
  );
}

export function createMaterialTopTabNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: MaterialTopTabNavigationOptions;
    EventMap: MaterialTopTabNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: MaterialTopTabNavigationProp<
        ParamList,
        RouteName,
        NavigatorID
      >;
    };
    Navigator: typeof MaterialTopTabNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(MaterialTopTabNavigator)(config);
}
