import { ParamListBase, type EventMapBase } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';
import { NativeTabOptions, type NativeTabsViewProps } from './NativeTabsView';
export interface NativeTabsNavigatorProps extends PropsWithChildren<Omit<NativeTabsViewProps, 'builder'>> {
    /**
     * The behavior when navigating back with the back button.
     *
     * @platform android
     */
    backBehavior?: 'none' | 'initialRoute' | 'history';
}
export declare function NativeTabsNavigator({ children, backBehavior, ...rest }: NativeTabsNavigatorProps): React.JSX.Element;
export declare const NativeTabsNavigatorWithContext: React.ForwardRefExoticComponent<Omit<NativeTabsNavigatorProps, "children"> & Partial<Pick<NativeTabsNavigatorProps, "children">> & React.RefAttributes<unknown>> & {
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