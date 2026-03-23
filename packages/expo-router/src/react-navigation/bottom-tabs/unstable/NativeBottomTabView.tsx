import {
  type ParamListBase,
  type TabNavigationState,
} from '@react-navigation/native';

import type {
  NativeBottomTabDescriptorMap,
  NativeBottomTabNavigationConfig,
  NativeBottomTabNavigationHelpers,
} from './types';

type Props = NativeBottomTabNavigationConfig & {
  state: TabNavigationState<ParamListBase>;
  navigation: NativeBottomTabNavigationHelpers;
  descriptors: NativeBottomTabDescriptorMap;
};

export function NativeBottomTabView(_: Props) {
  throw new Error('Native Bottom Tabs are not supported on this platform.');
}
