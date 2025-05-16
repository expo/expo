import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';
import { BottomTabs } from 'react-native-screens';
import BottomTabsScreen from 'react-native-screens/src/components/BottomTabsScreen';

export interface NativeTabProps extends DefaultRouterOptions {
  label: string;
}

export type NativeTabsViewProps = {
  builder: ReturnType<
    typeof useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      Record<string, (...args: any) => void>,
      NativeTabProps,
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
      return (
        <BottomTabsScreen
          key={route.key}
          isFocused={isFocused}
          badgeValue={descriptor.options?.label ?? descriptor.route.name}
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

  return <BottomTabs>{children}</BottomTabs>;
}
