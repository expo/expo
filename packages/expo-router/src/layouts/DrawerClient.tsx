'use client';

import {
  createStandardDrawerNavigator,
  type DrawerNavigationOptions,
} from '../react-navigation/drawer';
import type {
  DrawerNavigatorCreateProps,
  DrawerNavigatorProps,
  StandardDrawerNavigationEventMap,
} from '../react-navigation/drawer/navigators/createDrawerNavigator';
import type { DrawerNavigationHelpers } from '../react-navigation/drawer/types';
import {
  DrawerRouter,
  type DrawerNavigationState,
  type DrawerRouterOptions,
  type ParamListBase,
} from '../react-navigation/native';
import { unstable_integrateWithRouter } from '../standard-navigation';

export const Drawer = unstable_integrateWithRouter<
  DrawerNavigationOptions,
  DrawerNavigationState<ParamListBase>,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorProps,
  DrawerRouterOptions,
  DrawerNavigatorCreateProps
>(createStandardDrawerNavigator, DrawerRouter, {
  createProps: ({ state, navigation }) => ({
    drawerState: state,
    // `createProps` exposes base helpers, but `DrawerRouter` adds drawer action helpers at runtime.
    navigation: navigation as DrawerNavigationHelpers,
  }),
});

export default Drawer;
