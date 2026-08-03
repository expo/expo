'use client';
import { useCallback } from 'react';

import { useStandardEmitter } from '../../../standard-navigation/useStandardEmitter';
import {
  CommonActions,
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  StackActions,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../native';
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
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: BottomTabNavigatorProps) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    BottomTabNavigationOptions,
    BottomTabNavigationEventMap
  >(TabRouter, {
    id,
    initialRouteName,
    backBehavior,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  const emitter = useStandardEmitter(navigation);

  const navigateToTab = useCallback(
    (routeKey: string) => {
      const route = state.routes.find((route) => route.key === routeKey);

      if (route) {
        navigation.dispatch({
          ...CommonActions.navigate(route),
          target: state.key,
        });
      } else if (__DEV__) {
        console.warn(
          `Bottom tabs could not switch to the tab "${routeKey}" because no tab with that key exists. ` +
            `'navigateToTab' takes a route key, not a route name — pass 'route.key' from the tab bar props.`
        );
      }
    },
    [navigation, state.key, state.routes]
  );

  const popNestedStackToTop = useCallback(
    (routeKey: string) => {
      const prevRoute = state.routes.find((route) => route.key === routeKey);

      if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
        navigation.dispatch({
          ...StackActions.popToTop(),
          target: prevRoute.state.key,
        });
      }
    },
    [navigation, state.routes]
  );

  return (
    <NavigationContent>
      <BottomTabView
        {...rest}
        state={state}
        descriptors={descriptors}
        emitter={emitter}
        navigateToTab={navigateToTab}
        preloadedRouteKeys={state.preloadedRouteKeys}
        popNestedStackToTop={popNestedStackToTop}
      />
    </NavigationContent>
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
>(): TypedNavigator<TypeBag> {
  return createNavigatorFactory(BottomTabNavigator)();
}
