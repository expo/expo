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
import { shouldTabBeVisible } from './utils';
import { getPathFromState } from '../../link/linking';

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

  const { state, descriptors } = builder;
  const { routes } = state;
  let focusedIndex = state.index;
  const isAnyRouteFocused =
    routes[focusedIndex].key &&
    descriptors[routes[focusedIndex].key] &&
    shouldTabBeVisible(descriptors[routes[focusedIndex].key].options);

  if (!isAnyRouteFocused) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${getPathFromState(state)}"`
      );
    }
    // Set focusedIndex to the first visible tab
    focusedIndex = routes.findIndex((route) => shouldTabBeVisible(descriptors[route.key].options));
  }

  return (
    <NativeTabsContext value>
      <NativeTabsView builder={builder} {...rest} focusedIndex={focusedIndex} />
    </NativeTabsContext>
  );
}

const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

export const NativeTabsNavigatorWithContext = withLayoutContext<
  NativeTabOptions,
  typeof NativeTabsNavigator,
  NavigationState,
  EventMapBase
>(createNativeTabNavigator().Navigator, undefined, true);
