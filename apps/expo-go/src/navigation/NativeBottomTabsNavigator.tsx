import {
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackNavigationState,
  type StaticConfig,
  TabRouter,
  type TypedNavigator,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';
import { BottomTabs, BottomTabsScreen } from 'react-native-screens';

function NativeBottomTabsNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  router,
  ...rest
}: any) {
  const { state, descriptors, navigation } = useNavigationBuilder(TabRouter, {
    id,
    initialRouteName,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
  });
  const { routes } = state;
  const deferredFocusedIndex = React.useDeferredValue(state.index);

  return (
    <BottomTabs
      tabBarBackgroundColor={rest.tabBarStyle?.backgroundColor}
      tabBarTintColor={rest.tabBarActiveTintColor}
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        const descriptor = descriptors[tabKey];
        const route = descriptor.route;
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: route.name,
          },
        });
      }}>
      {routes
        .map((route, index) => ({ route, index }))
        .map(({ route, index }) => {
          const descriptor = descriptors[route.key];
          const isFocused = index === deferredFocusedIndex;

          return (
            <BottomTabsScreen
              {...descriptor.options}
              key={route.key}
              tabKey={route.key}
              title={descriptor.options.tabBarLabel ?? route.name}
              isFocused={isFocused}
              icon={descriptor.options.tabBarIcon()}
              standardAppearance={{ tabBarBackgroundColor: rest.tabBarStyle?.backgroundColor }}
              scrollEdgeAppearance={{ tabBarBackgroundColor: rest.tabBarStyle?.backgroundColor }}>
              {descriptor.render()}
            </BottomTabsScreen>
          );
        })}
    </BottomTabs>
  );
}

export function createNativeBottomTabsNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: any;
    EventMap: any;
    NavigationList: {
      [RouteName in keyof ParamList]: any;
    };
    Navigator: any;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(NativeBottomTabsNavigator)(config);
}
