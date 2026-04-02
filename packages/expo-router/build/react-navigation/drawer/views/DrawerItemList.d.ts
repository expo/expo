import * as React from 'react';
import { type DrawerNavigationState, type ParamListBase } from '../../native';
import type { DrawerDescriptorMap, DrawerNavigationHelpers } from '../types';
type Props = {
    state: DrawerNavigationState<ParamListBase>;
    navigation: DrawerNavigationHelpers;
    descriptors: DrawerDescriptorMap;
};
/**
 * Component that renders the navigation list in the drawer.
 */
export declare function DrawerItemList({ state, navigation, descriptors }: Props): React.ReactElement;
export {};
//# sourceMappingURL=DrawerItemList.d.ts.map