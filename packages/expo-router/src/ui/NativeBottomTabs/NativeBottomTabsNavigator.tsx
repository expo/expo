import {
  createNavigatorFactory,
  NavigationState,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React, { ComponentProps, PropsWithChildren } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabOptions, NativeTabsView, type NativeTabsViewProps } from './NativeTabsView';
import { withLayoutContext } from '../..';
import { Tab } from './TabOptions';

export interface NativeTabsNavigatorProps
  extends PropsWithChildren<Omit<NativeTabsViewProps, 'builder'>> {
  backBehavior?: 'none' | 'initialRoute' | 'history';
}

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';

function NativeTabsNavigator({
  children,
  backBehavior = defaultBackBehavior,
  ...rest
}: NativeTabsNavigatorProps) {
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

export const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

const NTN = withLayoutContext<NativeTabOptions, typeof NativeTabsNavigator, NavigationState, {}>(
  createNativeTabNavigator().Navigator,
  (screens) => {
    return screens;
  }
);

export const NativeTabs = Object.assign(
  (props: ComponentProps<typeof NativeTabsNavigator>) => {
    return <NTN {...props} />;
  },
  { Trigger: Tab }
);
