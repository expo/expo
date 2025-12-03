import { type DrawerNavigationState, type DrawerStatus, type ParamListBase } from '@react-navigation/native';
import * as React from 'react';
import type { DrawerContentComponentProps, DrawerDescriptorMap, DrawerNavigationConfig, DrawerNavigationHelpers } from '../types';
type Props = DrawerNavigationConfig & {
    defaultStatus: DrawerStatus;
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
};
export declare function DrawerContent({ descriptors, state, ...rest }: DrawerContentComponentProps): React.JSX.Element;
export declare function DrawerView({ navigation, ...rest }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=DrawerView.d.ts.map