import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import { withLayoutContext } from './withLayoutContext';

const NativeStackNavigator = createNativeStackNavigator().Navigator;

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(NativeStackNavigator);

export default Stack;
