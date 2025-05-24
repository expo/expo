import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Stack from './StackClient';
import { Screen } from '../views/Screen';

export type StackNavigationProp<
  ParamList extends ParamListBase = ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NativeStackNavigationProp<ParamList, RouteName, NavigatorID>;

Stack.Screen = Screen;

export { Stack };

export default Stack;
