'use client';
import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import { withLayoutContext } from './withLayoutContext';
import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';

const NativeStackNavigator = createNativeStackNavigator().Navigator;

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(NativeStackNavigator);

export default Stack;
