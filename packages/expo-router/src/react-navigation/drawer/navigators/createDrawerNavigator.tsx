'use client';
import * as React from 'react';

import { useOptionalContextKey } from '../../../Route';
import { NavigatorTypeContext } from '../../core/NavigatorTypeContext';
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
  UNSTABLE_routeNamesChangeBehavior,
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
  usePreloadRoutes(state, navigation, nonLazyRouteNames);

  return (
    <NavigatorTypeContext value="drawer">
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
