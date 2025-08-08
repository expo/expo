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
import React, { PropsWithChildren, use } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import {
  NativeTabOptions,
  NativeTabsContext,
  NativeTabsView,
  type NativeTabsViewProps,
} from './NativeTabsView';
import { withLayoutContext } from '../..';

export interface NativeTabsNavigatorProps
  extends PropsWithChildren<Omit<NativeTabsViewProps, 'builder'>> {
  /**
   * The behavior when navigating back with the back button.
   *
   * @platform android
   */
  backBehavior?: 'none' | 'initialRoute' | 'history';
}

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';

export function NativeTabsNavigator({
  children,
  backBehavior = defaultBackBehavior,
  ...rest
}: NativeTabsNavigatorProps) {
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

  return <NativeTabsView builder={builder} {...rest} />;
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
