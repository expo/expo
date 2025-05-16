import React, { PropsWithChildren } from 'react';

import { NativeTabsViewProps, RNSNativeTabs } from './RNSNativeTabs';
import { RNSNativeTabsScreen } from './RNSNativeTabsScreen';

export function NativeTabsView(props: PropsWithChildren<NativeTabsViewProps>) {
  const { state, descriptors, navigation } = props.builder;
  const { routes } = state;

  const children = routes
    .filter(({ key }) => (descriptors[key].options as any)?.tabBarItemStyle?.display !== 'none')
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;
      return (
        <RNSNativeTabsScreen
          key={route.key}
          isFocused={isFocused}
          badgeValue={descriptor.route.name}
          onAppear={() => {
            navigation.dispatch({
              type: 'JUMP_TO',
              target: state.key,
              payload: {
                name: route.name,
              },
            });
          }}>
          {descriptor.render()}
        </RNSNativeTabsScreen>
      );
    });

  return <RNSNativeTabs>{children}</RNSNativeTabs>;
}
