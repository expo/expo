import type { NativeBottomTabDescriptorMap, NativeBottomTabNavigationHelpers } from './types';
import { type ParamListBase, type TabNavigationState } from '../../native';

type Props = {
  state: TabNavigationState<ParamListBase>;
  navigation: NativeBottomTabNavigationHelpers;
  descriptors: NativeBottomTabDescriptorMap;
};

export function NativeBottomTabView(_: Props) {
  throw new Error('Native Bottom Tabs are not supported on this platform.');
}
