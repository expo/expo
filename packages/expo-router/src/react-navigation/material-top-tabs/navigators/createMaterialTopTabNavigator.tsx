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
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: MaterialTopTabNavigatorProps) {
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
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap
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
      <MaterialTopTabView
        {...rest}
        state={state}
        navigation={navigation}
        descriptors={descriptors}
      />
    </NavigationContent>
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
>(): TypedNavigator<TypeBag> {
  return createNavigatorFactory(MaterialTopTabNavigator)();
}
