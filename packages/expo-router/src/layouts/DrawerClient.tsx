'use client';

import {
  createStandardDrawerNavigator,
  type DrawerNavigationOptions,
} from '../react-navigation/drawer';
import type {
  DrawerNavigatorContentProps,
  StandardDrawerNavigationEventMap,
} from '../react-navigation/drawer/navigators/createStandardDrawerNavigator';
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
  DrawerNavigatorContentProps,
  DrawerRouterOptions
>(createStandardDrawerNavigator, DrawerRouter, {
  createProps: ({ state, navigation }) => ({
    drawerState: state,
    navigation: navigation as DrawerNavigationHelpers,
  }),
});

export default Drawer;
