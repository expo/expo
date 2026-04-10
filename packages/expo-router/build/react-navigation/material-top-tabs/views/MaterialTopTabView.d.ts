import { type ParamListBase, type TabNavigationState } from '../../native';
import type { MaterialTopTabDescriptorMap, MaterialTopTabNavigationConfig, MaterialTopTabNavigationHelpers } from '../types';
type Props = MaterialTopTabNavigationConfig & {
    state: TabNavigationState<ParamListBase>;
    navigation: MaterialTopTabNavigationHelpers;
    descriptors: MaterialTopTabDescriptorMap;
};
export declare function MaterialTopTabView({ tabBar, state, navigation, descriptors, ...rest }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=MaterialTopTabView.d.ts.map