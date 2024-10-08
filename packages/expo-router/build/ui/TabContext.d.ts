/// <reference types="react" />
import { BottomTabNavigationOptions, BottomTabNavigationConfig } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { DefaultNavigatorOptions, NavigationAction, ParamListBase, TabActionHelpers, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import { TriggerMap } from './common';
export type ExpoTabsProps = DefaultNavigatorOptions<ParamListBase, TabNavigationState<ParamListBase>, ExpoTabsScreenOptions, TabNavigationEventMap> & Omit<TabRouterOptions, 'initialRouteName'> & // Should be set through `unstable_settings`
BottomTabNavigationConfig;
export type ExpoTabsScreenOptions = Pick<BottomTabNavigationOptions, 'title' | 'lazy' | 'unmountOnBlur' | 'freezeOnBlur'> & {
    params?: object;
    title: string;
    action: NavigationAction;
};
export type TabNavigationEventMap = {
    /**
     * Event which fires on tapping on the tab in the tab bar.
     */
    tabPress: {
        data: undefined;
        canPreventDefault: true;
    };
    /**
     * Event which fires on long press on the tab in the tab bar.
     */
    tabLongPress: {
        data: undefined;
    };
};
export type TabsContextValue = ReturnType<typeof useNavigationBuilder<TabNavigationState<any>, TabRouterOptions, TabActionHelpers<ParamListBase>, BottomTabNavigationOptions, TabNavigationEventMap>>;
export type TabContextValue = TabsDescriptor['options'];
export declare const TabContext: import("react").Context<BottomTabNavigationOptions>;
export declare const TabTriggerMapContext: import("react").Context<TriggerMap>;
export declare const TabsDescriptorsContext: import("react").Context<Record<string, import("@react-navigation/native").Descriptor<BottomTabNavigationOptions, Omit<{
    dispatch(action: Readonly<{
        type: string;
        payload?: object | undefined;
        source?: string | undefined;
        target?: string | undefined;
    }> | ((state: TabNavigationState<any>) => Readonly<{
        type: string;
        payload?: object | undefined;
        source?: string | undefined;
        target?: string | undefined;
    }>)): void;
    navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName] | [screen: RouteName, params: object | undefined] : never): void;
    navigate<RouteName_1 extends string>(options: RouteName_1 extends unknown ? {
        key: string;
        params?: object | undefined;
        merge?: boolean | undefined;
    } | {
        name: RouteName_1;
        key?: string | undefined;
        params: object | undefined;
        merge?: boolean | undefined;
    } : never): void;
    reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    goBack(): void;
    isFocused(): boolean;
    canGoBack(): boolean;
    getId(): string | undefined;
    getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T;
    getState(): TabNavigationState<any>;
} & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
    getParent<T_1 = import("@react-navigation/native").NavigationProp<ParamListBase, string, undefined, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>, {}, {}> | undefined>(id?: string | undefined): T_1;
    setParams(params: Partial<object | undefined>): void;
    setOptions(options: Partial<BottomTabNavigationOptions>): void;
} & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>>;
export declare const TabsNavigatorContext: import("react").Context<({
    dispatch(action: Readonly<{
        type: string;
        payload?: object | undefined;
        source?: string | undefined;
        target?: string | undefined;
    }> | ((state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>) => Readonly<{
        type: string;
        payload?: object | undefined;
        source?: string | undefined;
        target?: string | undefined;
    }>)): void;
    navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName] | [screen: RouteName, params: object | undefined] : never): void;
    navigate<RouteName_1 extends string>(options: RouteName_1 extends unknown ? {
        key: string;
        params?: object | undefined;
        merge?: boolean | undefined;
    } | {
        name: RouteName_1;
        key?: string | undefined;
        params: object | undefined;
        merge?: boolean | undefined;
    } : never): void;
    reset(state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>>): void;
    goBack(): void;
    isFocused(): boolean;
    canGoBack(): boolean;
    getId(): string | undefined;
    getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T;
    getState(): Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>;
} & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<TabNavigationEventMap> & {
    setParams<RouteName_2 extends string>(params: Partial<object | undefined>): void;
} & TabActionHelpers<ParamListBase>) | null>;
export declare const TabsStateContext: import("react").Context<TabNavigationState<any>>;
export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
//# sourceMappingURL=TabContext.d.ts.map