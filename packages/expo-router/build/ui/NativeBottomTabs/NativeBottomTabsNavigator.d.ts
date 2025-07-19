import React, { ComponentProps, PropsWithChildren } from 'react';
import { type NativeTabsViewProps } from './NativeTabsView';
import { Tab } from './TabOptions';
declare function NativeTabsNavigator({ children, ...rest }: PropsWithChildren<Omit<NativeTabsViewProps, 'builder'>>): React.JSX.Element;
export declare const createNativeTabNavigator: (config?: any) => any;
export declare const NativeTabs: ((props: ComponentProps<typeof NativeTabsNavigator>) => React.JSX.Element) & {
    Trigger: typeof Tab;
};
export {};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map