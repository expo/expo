import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { type ParamListBase } from '@react-navigation/native';

import Tabs from './TabsClient';
import { Screen } from '../views/Screen';

export type TabNavigationProp<
  ParamList extends ParamListBase = ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;

Tabs.Screen = Screen;

export { Tabs };

export default Tabs;
