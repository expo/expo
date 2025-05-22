import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React from 'react';
import { BottomTabs, enableFreeze } from 'react-native-screens';
import { BottomTabsProps } from 'react-native-screens/lib/typescript/components/BottomTabs';
import BottomTabsScreen, {
  BottomTabsScreenProps,
} from 'react-native-screens/src/components/BottomTabsScreen';

enableFreeze(false);

export interface NativeTabOptions extends DefaultRouterOptions {
  placeholder?: React.ReactNode | undefined;
  badgeValue?: string;
  badgeColor?: BottomTabsScreenProps['badgeColor'];
  title?: string;
  icon?: string;
}

export type NativeTabsViewProps = BottomTabsProps & {
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

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, ...rest } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  const children = routes
    .filter(({ key }) => (descriptors[key].options as any)?.tabBarItemStyle?.display !== 'none')
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;

      return (
        <BottomTabsScreen
          {...descriptor.options}
          key={route.key}
          tabKey={route.key}
          isFocused={isFocused}
          onDidSelect={() => {
            navigation.emit({ type: 'tabSelected', target: descriptor.route.key });
          }}
          onWillAppear={() => {
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

  return <BottomTabs {...rest}>{children}</BottomTabs>;
}
