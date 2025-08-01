import React, { ComponentProps, PropsWithChildren } from 'react';
import { type NativeTabsViewProps } from './NativeTabsView';
import { Tab } from './TabOptions';
export interface NativeTabsNavigatorProps extends PropsWithChildren<Omit<NativeTabsViewProps, 'builder'>> {
    backBehavior?: 'none' | 'initialRoute' | 'history';
}
declare function NativeTabsNavigator({ children, backBehavior, ...rest }: NativeTabsNavigatorProps): React.JSX.Element;
export declare const createNativeTabNavigator: (config?: any) => any;
export declare const NativeTabs: ((props: ComponentProps<typeof NativeTabsNavigator>) => React.JSX.Element) & {
    Trigger: typeof Tab;
};
export {};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map