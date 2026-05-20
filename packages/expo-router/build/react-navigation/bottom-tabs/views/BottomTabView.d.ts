import { type ParamListBase, type TabNavigationState } from '../../native';
import type { BottomTabDescriptorMap, BottomTabNavigationConfig, BottomTabNavigationHelpers } from '../types';
type Props = BottomTabNavigationConfig & {
    state: TabNavigationState<ParamListBase>;
    navigation: BottomTabNavigationHelpers;
    descriptors: BottomTabDescriptorMap;
};
export declare function BottomTabView(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BottomTabView.d.ts.map