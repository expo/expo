'use client';

import { withLayoutContext } from './withLayoutContext';
import {
  createDrawerNavigator,
  DrawerNavigationOptions,
  DrawerNavigationEventMap,
} from '../react-navigation/drawer';
import { DrawerNavigationState, ParamListBase } from '../react-navigation/native';

const DrawerNavigator = createDrawerNavigator().Navigator;

export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(DrawerNavigator);

export default Drawer;
