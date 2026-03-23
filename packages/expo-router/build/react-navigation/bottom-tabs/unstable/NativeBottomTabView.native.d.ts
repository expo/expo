import * as React from 'react';
import type { NativeBottomTabDescriptorMap, NativeBottomTabNavigationHelpers } from './types';
import { type ParamListBase, type TabNavigationState } from '../../native';
type Props = {
    state: TabNavigationState<ParamListBase>;
    navigation: NativeBottomTabNavigationHelpers;
    descriptors: NativeBottomTabDescriptorMap;
};
export declare function NativeBottomTabView({ state, navigation, descriptors }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=NativeBottomTabView.native.d.ts.map