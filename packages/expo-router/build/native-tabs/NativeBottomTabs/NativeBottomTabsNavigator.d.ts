import React from 'react';
import type { NativeTabsProps, NativeTabsViewProps } from './types';
export declare const NativeTabsContext: React.Context<boolean>;
export declare function NativeTabsNavigator({ children, backBehavior, ...rest }: Omit<NativeTabsViewProps, 'focusedIndex' | 'builder'>): React.JSX.Element;
export declare function NativeTabsNavigatorWrapper({ children, ...rest }: NativeTabsProps): React.JSX.Element;
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map