import { NavigationState, useNavigationBuilder } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabsView } from './NativeTabsView';
import { withLayoutContext } from '../..';
import { NativeProps } from './RNSNativeTabs';

function NativeTabsNavigator({ children }: PropsWithChildren<NativeProps>) {
  const builder = useNavigationBuilder(NativeBottomTabsRouter, {
    children,
  });

  return <NativeTabsView builder={builder} />;
}

export const NativeTabs = withLayoutContext<
  NativeProps,
  typeof NativeTabsNavigator,
  NavigationState,
  {}
>(NativeTabsNavigator, (screens) => {
  return screens;
});
