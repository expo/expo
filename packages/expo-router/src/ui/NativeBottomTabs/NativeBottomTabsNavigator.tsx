import {
  createNavigatorFactory,
  NavigationState,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React, { ComponentProps, PropsWithChildren } from 'react';
import { enableFreeze } from 'react-native-screens';
import { BottomTabsProps } from 'react-native-screens/lib/typescript/components/BottomTabs';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabOptions, NativeTabsView } from './NativeTabsView';
import { withLayoutContext } from '../..';
import { BottomTabAccessoryProvider } from './NativeTabsViewContext';
import { Tab } from './TabOptions';

enableFreeze(true);

function NativeTabsNavigator({ children, ...rest }: PropsWithChildren<BottomTabsProps>) {
  const builder = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    Record<string, (...args: any) => void>,
    NativeTabOptions,
    Record<string, any>
  >(NativeBottomTabsRouter, {
    children,
  });

  return (
    <BottomTabAccessoryProvider>
      <NativeTabsView builder={builder} {...rest} />
    </BottomTabAccessoryProvider>
  );
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
  { Tab }
);
