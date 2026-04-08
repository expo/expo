import * as React from 'react';
import { type ParamListBase, type RouteProp, type StackNavigationState } from '../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap, NativeStackNavigationHelpers } from '../types';
type Props = {
    state: StackNavigationState<ParamListBase>;
    navigation: NativeStackNavigationHelpers;
    descriptors: NativeStackDescriptorMap;
    describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => NativeStackDescriptor;
};
export declare function NativeStackView({ state, descriptors, describe }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=NativeStackView.d.ts.map