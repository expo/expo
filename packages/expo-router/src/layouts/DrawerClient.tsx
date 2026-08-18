'use client';

import type { ComponentProps } from 'react';

import {
  createStandardDrawerNavigator,
  type DrawerNavigationOptions,
} from '../react-navigation/drawer';
import type {
  DrawerNavigatorCreateProps,
  DrawerNavigatorConfig,
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
import {
  appendMissingPlaceholderTabDescriptors,
  appendMissingPlaceholderTabRoutes,
} from '../standard-navigation/appendMissingPlaceholderTabRoutes';

export const Drawer = unstable_integrateWithRouter<
  DrawerNavigationOptions,
  DrawerNavigationState<ParamListBase>,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorConfig,
  DrawerRouterOptions,
  DrawerNavigatorCreateProps
>(createStandardDrawerNavigator, DrawerRouter, {
  processDescriptors: appendMissingPlaceholderTabDescriptors,
  processState: appendMissingPlaceholderTabRoutes,
  createProps: ({ state, navigation, dispatch }) => ({
    drawerState: state,
    // `createProps` exposes base helpers, but `DrawerRouter` adds drawer action helpers at runtime.
    navigation: navigation as DrawerNavigationHelpers,
    preload: (name) => dispatch({ type: 'PRELOAD', payload: { name } }),
  }),
});

export type DrawerNavigatorProps = ComponentProps<typeof Drawer>;

export default Drawer;
