import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { DefaultNavigatorOptions, NavigationAction, NavigationProp, ParamListBase, TabActionHelpers, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import { TriggerMap } from './common';
export type ExpoTabsProps = ExpoTabsNavigatorOptions;
export type ExpoTabsNavigatorScreenOptions = {
    detachInactiveScreens?: boolean;
    unmountOnBlur?: boolean;
    freezeOnBlur?: boolean;
    lazy?: boolean;
};
export type ExpoTabsNavigatorOptions = DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, ExpoTabsScreenOptions, TabNavigationEventMap, ExpoTabsNavigationProp<ParamListBase>> & Omit<TabRouterOptions, 'initialRouteName'> & ExpoTabsNavigatorScreenOptions;
export type ExpoTabsNavigationProp<ParamList extends ParamListBase, RouteName extends keyof ParamList = keyof ParamList, NavigatorID extends string | undefined = undefined> = NavigationProp<ParamList, RouteName, NavigatorID, TabNavigationState<ParamListBase>, ExpoTabsScreenOptions, TabNavigationEventMap>;
export type ExpoTabsScreenOptions = Pick<BottomTabNavigationOptions, 'title' | 'lazy' | 'freezeOnBlur'> & {
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
/**
 * The React Navigation custom navigator.
 *
 * @see [`useNavigationBuilder`](https://reactnavigation.org/docs/custom-navigators/#usenavigationbuilder) hook from React Navigation for more information.
 */
export type TabsContextValue = ReturnType<typeof useNavigationBuilder<TabNavigationState<any>, TabRouterOptions, TabActionHelpers<ParamListBase>, ExpoTabsNavigatorScreenOptions, TabNavigationEventMap>>;
export type TabContextValue = TabsDescriptor['options'];
export declare const TabContext: import("react").Context<ExpoTabsNavigatorScreenOptions>;
/**
 * @hidden
 */
export declare const TabTriggerMapContext: import("react").Context<TriggerMap>;
/**
 * @hidden
 */
export declare const TabsDescriptorsContext: import("react").Context<Record<string, import("@react-navigation/native").Descriptor<ExpoTabsNavigatorScreenOptions, Omit<{
    dispatch(action: Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }> | ((state: Readonly<TabNavigationState<any>>) => Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>)): void;
    navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined, options?: {
        merge?: boolean;
        pop?: boolean;
    } | undefined] : never): void;
    navigate<RouteName extends string>(options: RouteName extends unknown ? {
        name: RouteName;
        params: object | undefined;
        path?: string;
        merge?: boolean;
        pop?: boolean;
    } : never): void;
    navigateDeprecated<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
    navigateDeprecated<RouteName extends string>(options: RouteName extends unknown ? {
        name: RouteName;
        params: object | undefined;
        merge?: boolean;
    } : never): void;
    preload<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
    reset(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
    goBack(): void;
    isFocused(): boolean;
    canGoBack(): boolean;
    getId(): string | undefined;
    getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
    getState(): TabNavigationState<any>;
    setStateForNextRouteNamesChange(state: TabNavigationState<any> | import("@react-navigation/native").PartialState<TabNavigationState<any>>): void;
} & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
    getParent<T = NavigationProp<ParamListBase, string, undefined, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, {}, {}> | undefined>(id?: string | undefined): T;
    setParams(params: Partial<object | undefined>): void;
    setOptions(options: Partial<ExpoTabsNavigatorScreenOptions>): void;
} & import("@react-navigation/native").EventConsumer<TabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<any>>> & import("@react-navigation/native").PrivateValueStore<[ParamListBase, string, TabNavigationEventMap]> & TabActionHelpers<ParamListBase>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>>;
/**
 * @hidden
 */
export declare const TabsNavigatorContext: import("react").Context<({
    dispatch(action: Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }> | ((state: Readonly<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>>) => NavigationAction)): void;
    navigate<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined, options?: {
        merge?: boolean;
        pop?: boolean;
    } | undefined] : never): void;
    navigate<RouteName extends string>(options: RouteName extends unknown ? {
        name: RouteName;
        params: object | undefined;
        path?: string;
        merge?: boolean;
        pop?: boolean;
    } : never): void;
    navigateDeprecated<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
    navigateDeprecated<RouteName extends string>(options: RouteName extends unknown ? {
        name: RouteName;
        params: object | undefined;
        merge?: boolean;
    } : never): void;
    preload<RouteName extends string>(...args: RouteName extends unknown ? [screen: RouteName, params?: object | undefined] : never): void;
    reset(state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>>): void;
    goBack(): void;
    isFocused(): boolean;
    canGoBack(): boolean;
    getId(): string | undefined;
    getParent<T = import("@react-navigation/native").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
    getState(): Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>;
    setStateForNextRouteNamesChange(state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>>): void;
} & import("@react-navigation/native").PrivateValueStore<[ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<TabNavigationEventMap> & {
    setParams<RouteName extends string>(params: Partial<object | undefined>): void;
} & TabActionHelpers<ParamListBase>) | null>;
/**
 * @hidden
 */
export declare const TabsStateContext: import("react").Context<TabNavigationState<any>>;
export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
//# sourceMappingURL=TabContext.d.ts.map