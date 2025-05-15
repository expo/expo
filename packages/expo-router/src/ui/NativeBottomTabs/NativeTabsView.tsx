import { getPathFromState, getStateFromPath, TabActions } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';

import { NativeTabsViewProps, RNSNativeTabs } from './RNSNativeTabs';
import { RNSNativeTabsScreen } from './RNSNativeTabsScreen';

export function NativeTabsView(props: PropsWithChildren<NativeTabsViewProps>) {
  const { state, descriptors, navigation } = props.builder;
  const { routes } = state;

  const children = routes
    .filter(({ key }) => descriptors[key].options?.tabBarItemStyle?.display !== 'none')
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;
      return (
        <RNSNativeTabsScreen
          key={route.key}
          isFocused={isFocused}
          badgeValue={descriptor.route.name}
          onAppear={() => {
            const href = descriptor.options?.href;
            if (href) {
              const newState = getStateFromPath(href);
              console.log(newState);
              if (newState && getPathFromState(newState) !== getPathFromState(state)) {
                return navigation.reset(newState);
              }
            }
            navigation.dispatch(TabActions.jumpTo(route.name));
          }}>
          {descriptor.render()}
        </RNSNativeTabsScreen>
      );
    });

  return <RNSNativeTabs>{children}</RNSNativeTabs>;
}
