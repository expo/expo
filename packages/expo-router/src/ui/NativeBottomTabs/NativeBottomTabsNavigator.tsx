import { NavigationState, useNavigationBuilder } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabsView } from './NativeTabsView';
import { withLayoutContext } from '../..';
import { NativeProps } from './RNSNativeTabs';
import { Screen } from '../../primitives';

function NativeTabsNavigator({ children }: PropsWithChildren<NativeProps>) {
  const builder = useNavigationBuilder(NativeBottomTabsRouter, {
    children,
  });

  return <NativeTabsView builder={builder} />;
}

// export const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

export const NativeTabs = Object.assign(
  withLayoutContext<
    NativeProps,
    typeof NativeTabsNavigator,
    NavigationState,
    {}
    // >(createNativeTabNavigator().Navigator, (screens) => {
  >(NativeTabsNavigator, (screens) => {
    return screens;
  }),
  { Tab: Screen }
);
