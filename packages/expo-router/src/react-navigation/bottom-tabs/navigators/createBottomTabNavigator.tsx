'use client';
import {
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  type TypedNavigator,
  useNavigationBuilder,
  useStateForRouteNamesChange,
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
  const {
    state: builderState,
    descriptors,
    navigation,
    NavigationContent,
    routeNames,
  } = useNavigationBuilder<
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

  // Reconcile the state when the declared route names change (e.g. HMR); the view receives the
  // filtered display state while the `ROUTE_NAMES_CHANGED` dispatch commits.
  const state = useStateForRouteNamesChange({ state: builderState, routeNames, navigation });

  return (
    <NavigationContent>
      <BottomTabView {...rest} state={state} navigation={navigation} descriptors={descriptors} />
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
