import { ParamListBase } from '@react-navigation/native';
import React, { ComponentProps, PropsWithChildren } from 'react';
import { NativeTabOptions } from './NativeTabsView';
declare function NativeTabsNavigator({ children }: PropsWithChildren): React.JSX.Element;
export declare const createNativeTabNavigator: (config?: any) => any;
export declare const NativeTabs: ((props: ComponentProps<typeof NativeTabsNavigator>) => React.JSX.Element) & {
    Tab: (props: import("../..").ScreenProps<NativeTabOptions, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, {}>) => null;
};
export {};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map