import type { NativeStackDescriptor, NativeStackDescriptorMap, NativeStackNavigationHelpers } from '../types';
import { type ParamListBase, type RouteProp, type StackNavigationState } from '../../native';
type Props = {
    state: StackNavigationState<ParamListBase>;
    navigation: NativeStackNavigationHelpers;
    descriptors: NativeStackDescriptorMap;
    describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => NativeStackDescriptor;
};
export declare function NativeStackView({ state, navigation, descriptors, describe }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=NativeStackView.native.d.ts.map