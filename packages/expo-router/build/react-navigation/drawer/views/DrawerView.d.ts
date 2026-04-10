import * as React from 'react';
import { type DrawerNavigationState, type DrawerStatus, type ParamListBase } from '../../native';
import type { DrawerDescriptorMap, DrawerNavigationConfig, DrawerNavigationHelpers } from '../types';
type Props = DrawerNavigationConfig & {
    defaultStatus: DrawerStatus;
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
};
export declare function DrawerView({ navigation, ...rest }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=DrawerView.d.ts.map