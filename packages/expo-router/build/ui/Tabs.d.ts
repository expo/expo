import { DefaultNavigatorOptions, ParamListBase, TabActionHelpers, TabNavigationState } from '@react-navigation/native';
import { ReactNode } from 'react';
import { ViewProps } from 'react-native';
import { ExpoTabsScreenOptions, TabNavigationEventMap } from './TabContext';
import { ExpoTabRouterOptions } from './TabRouter';
import { ScreenTrigger } from './common';
export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';
export type UseTabsOptions = Omit<DefaultNavigatorOptions<ParamListBase, TabNavigationState<any>, ExpoTabsScreenOptions, TabNavigationEventMap>, 'children'> & Omit<ExpoTabRouterOptions, 'initialRouteName' | 'triggerMap'>;
export type TabsProps = ViewProps & {
    asChild?: boolean;
    options?: UseTabsOptions;
};
export declare function Tabs({ children, asChild, options, ...props }: TabsProps): import("react").JSX.Element;
export type UseTabsWithChildrenOptions = UseTabsOptions & {
    children: ReactNode;
};
export type UseTabsWithTriggersOptions<T extends string | object> = UseTabsOptions & {
    triggers: ScreenTrigger<T>[];
};
export declare function useTabsWithChildren({ children, ...options }: UseTabsWithChildrenOptions): {
    state: TabNavigationState<any>;
    descriptors: Record<string, import("@react-navigation/native").Descriptor<ExpoTabsScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: Readonly<TabNavigationState<any>>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigate<RouteName_1 extends string>(options: {
            name: string;
            params: object | undefined;
            path?: string | undefined;
            merge?: boolean | undefined;
        }): void;
        navigateDeprecated<RouteName_2 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigateDeprecated<RouteName_3 extends string>(options: {
            name: string;
            params: object | undefined;
            merge?: boolean | undefined;
        }): void;
        preload<RouteName_4 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T;
        getState(): TabNavigationState<any>;
        setStateForNextRouteNamesChange(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T_1 = import("@react-navigation/native").NavigationProp<ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T_1;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<ExpoTabsScreenOptions>): void;
    } & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
    navigation: {
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: Readonly<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName_5 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigate<RouteName_6 extends string>(options: {
            name: string;
            params: object | undefined;
            path?: string | undefined;
            merge?: boolean | undefined;
        }): void;
        navigateDeprecated<RouteName_7 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigateDeprecated<RouteName_8 extends string>(options: {
            name: string;
            params: object | undefined;
            merge?: boolean | undefined;
        }): void;
        preload<RouteName_9 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_2 = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T_2;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
        setStateForNextRouteNamesChange(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<TabNavigationEventMap> & {
        setParams<RouteName_10 extends string>(params: Partial<object | undefined>): void;
    } & TabActionHelpers<ParamListBase>;
    NavigationContent: import("react").ForwardRefExoticComponent<{
        children: ReactNode;
    } & import("react").RefAttributes<unknown>>;
};
export declare function useTabsWithTriggers<T extends string | object>({ triggers, ...options }: UseTabsWithTriggersOptions<T>): {
    state: TabNavigationState<any>;
    descriptors: Record<string, import("@react-navigation/native").Descriptor<ExpoTabsScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: Readonly<TabNavigationState<any>>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigate<RouteName_1 extends string>(options: {
            name: string;
            params: object | undefined;
            path?: string | undefined;
            merge?: boolean | undefined;
        }): void;
        navigateDeprecated<RouteName_2 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigateDeprecated<RouteName_3 extends string>(options: {
            name: string;
            params: object | undefined;
            merge?: boolean | undefined;
        }): void;
        preload<RouteName_4 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_1 = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T_1;
        getState(): TabNavigationState<any>;
        setStateForNextRouteNamesChange(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T_2 = import("@react-navigation/native").NavigationProp<ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T_2;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<ExpoTabsScreenOptions>): void;
    } & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
    navigation: {
        dispatch(action: Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }> | ((state: Readonly<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName_5 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigate<RouteName_6 extends string>(options: {
            name: string;
            params: object | undefined;
            path?: string | undefined;
            merge?: boolean | undefined;
        }): void;
        navigateDeprecated<RouteName_7 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigateDeprecated<RouteName_8 extends string>(options: {
            name: string;
            params: object | undefined;
            merge?: boolean | undefined;
        }): void;
        preload<RouteName_9 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_3 = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string | undefined): T_3;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
        setStateForNextRouteNamesChange(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<TabNavigationEventMap> & {
        setParams<RouteName_10 extends string>(params: Partial<object | undefined>): void;
    } & TabActionHelpers<ParamListBase>;
    NavigationContent: import("react").ForwardRefExoticComponent<{
        children: ReactNode;
    } & import("react").RefAttributes<unknown>>;
};
//# sourceMappingURL=Tabs.d.ts.map