import { ParamListBase, type EventMapBase } from '@react-navigation/native';
import React from 'react';
import type { NativeTabOptions, NativeTabsProps } from './types';
export declare const NativeTabsContext: React.Context<boolean>;
export declare function NativeTabsNavigator({ children, backBehavior, ...rest }: NativeTabsProps): React.JSX.Element;
export declare const NativeTabsNavigatorWithContext: React.ForwardRefExoticComponent<Omit<NativeTabsProps, "children"> & Partial<Pick<NativeTabsProps, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../..").ScreenProps<NativeTabOptions, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, EventMapBase>) => null;
    Protected: typeof import("../../views/Protected").Protected;
};
//# sourceMappingURL=NativeBottomTabsNavigator.d.ts.map