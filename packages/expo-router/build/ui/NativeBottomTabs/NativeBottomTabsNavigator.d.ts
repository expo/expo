import React from 'react';
import { NativeProps } from './RNSNativeTabs';
export declare const NativeTabs: React.ForwardRefExoticComponent<Omit<NativeProps & {
    children?: React.ReactNode | undefined;
}, "children"> & Partial<Pick<NativeProps & {
    children?: React.ReactNode | undefined;
}, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../..").ScreenProps<NativeProps, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, {}>) => null;
    Protected: typeof import("../../views/Protected").Protected;
} & {
    Tab: any;
};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map