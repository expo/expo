import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';
import { BottomTabs, enableFreeze } from 'react-native-screens';
import BottomTabsScreen from 'react-native-screens/src/components/BottomTabsScreen';

enableFreeze(false);

export interface NativeTabOptions extends DefaultRouterOptions {
  label?: string;
  icon?: string;
}

export type NativeTabsViewProps = {
  builder: ReturnType<
    typeof useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      Record<string, (...args: any) => void>,
      NativeTabOptions,
      Record<string, any>
    >
  >;
};

export function NativeTabsView(props: PropsWithChildren<NativeTabsViewProps>) {
  const { state, descriptors, navigation } = props.builder;
  const { routes } = state;

  const children = routes
    .filter(({ key }) => (descriptors[key].options as any)?.tabBarItemStyle?.display !== 'none')
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;
      /**
       * To get more tabs that feel more like iOS, we would need to add:
       * - title
       * - icon
       *
       * For icons I would propose either:
       * - passing a string and then using SF Symbols or Material Icons (how to do this on Android?) - androidx.compose.material.Icon
       *
       */
      const icon = descriptor.options?.icon;
      const label = descriptor.options?.label;
      const title = label ? label : !icon ? descriptor.route.name : undefined;
      return (
        <BottomTabsScreen
          key={route.key}
          isFocused={isFocused}
          title={title}
          icon={icon}
          onWillAppear={() => {
            console.log('On will appear');
            navigation.dispatch({
              type: 'JUMP_TO',
              target: state.key,
              payload: {
                name: route.name,
              },
            });
          }}>
          {descriptor.render()}
        </BottomTabsScreen>
      );
    });

  return <BottomTabs tabBarBackgroundColor="white">{children}</BottomTabs>;
}
