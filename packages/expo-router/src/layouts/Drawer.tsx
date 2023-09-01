import {
  createDrawerNavigator,
  DrawerNavigationOptions,
  DrawerNavigationEventMap,
} from '@react-navigation/drawer';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';

import { withLayoutContext } from './withLayoutContext';

const DrawerNavigator = createDrawerNavigator().Navigator;

export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(DrawerNavigator);

export default Drawer;
