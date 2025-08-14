'use client';

import {
  createNavigatorFactory,
  NavigationState,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
  type EventMapBase,
} from '@react-navigation/native';
import React, { use } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabsView } from './NativeTabsView';
import { withLayoutContext } from '../..';
import type { NativeTabOptions, NativeTabsProps } from './types';

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
export const NativeTabsContext = React.createContext<boolean>(false);

export function NativeTabsNavigator({
  children,
  backBehavior = defaultBackBehavior,
  ...rest
}: NativeTabsProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }
  const builder = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    Record<string, (...args: any) => void>,
    NativeTabOptions,
    Record<string, any>
  >(NativeBottomTabsRouter, {
    children,
    backBehavior,
  });

  return (
    <NativeTabsContext value>
      <NativeTabsView builder={builder} {...rest} />
    </NativeTabsContext>
  );
}

const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

export const NativeTabsNavigatorWithContext = withLayoutContext<
  NativeTabOptions,
  typeof NativeTabsNavigator,
  NavigationState,
  EventMapBase
>(createNativeTabNavigator().Navigator, (screens) => {
  return screens;
});
