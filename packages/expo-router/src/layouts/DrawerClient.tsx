'use client';

import { withLayoutContext } from './withLayoutContext';
import { withTabNavigationEvents } from '../navigationEvents/withNavigationEvents';
import type { DrawerNavigationOptions, DrawerNavigationEventMap } from '../react-navigation/drawer';
import { createDrawerNavigator } from '../react-navigation/drawer';
import type { DrawerNavigationState, ParamListBase } from '../react-navigation/native';

const DrawerNavigator = withTabNavigationEvents(createDrawerNavigator)().Navigator;

export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(DrawerNavigator);

export default Drawer;
