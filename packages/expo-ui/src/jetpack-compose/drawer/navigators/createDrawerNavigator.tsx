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
} from '@react-navigation/native';

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
  const { state, descriptors, navigation, NavigationContent } =
    useNavigationBuilder<
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

  return (
    <NavigationContent>
      <DrawerView
        {...rest}
        defaultStatus={defaultStatus}
        state={state}
        descriptors={descriptors}
        navigation={navigation}
      />
    </NavigationContent>
  );
}

export function createDrawerNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: DrawerNavigationState<ParamList>;
    ScreenOptions: DrawerNavigationOptions;
    EventMap: DrawerNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: DrawerNavigationProp<
        ParamList,
        RouteName,
        NavigatorID
      >;
    };
    Navigator: typeof DrawerNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(DrawerNavigator)(config);
}
