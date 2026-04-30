import type { ExperimentalStackDescriptor, ExperimentalStackDescriptorMap, ExperimentalStackNavigationHelpers } from './types';
import { type ParamListBase, type RouteProp, type StackNavigationState } from '../../react-navigation/native';
type Props = {
    state: StackNavigationState<ParamListBase>;
    navigation: ExperimentalStackNavigationHelpers;
    descriptors: ExperimentalStackDescriptorMap;
    describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => ExperimentalStackDescriptor;
};
export declare function ExperimentalStackView({ state, navigation, descriptors, describe }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ExperimentalStackView.d.ts.map