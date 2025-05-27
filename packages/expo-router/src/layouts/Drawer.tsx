import { type DrawerNavigationProp as RNDrawerNavigationProp } from '@react-navigation/drawer';
import { type ParamListBase } from '@react-navigation/native';

import Drawer from './DrawerClient';
import { Screen } from '../views/Screen';

export type DrawerNavigationProp<
  ParamList extends ParamListBase = ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = RNDrawerNavigationProp<ParamList, RouteName, NavigatorID>;

Drawer.Screen = Screen;

export { Drawer };

export default Drawer;
