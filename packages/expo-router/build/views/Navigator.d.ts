import { RouterFactory, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
type NavigatorTypes = ReturnType<typeof useNavigationBuilder>;
export declare const NavigatorContext: React.Context<{
    contextKey: string;
    state: NavigatorTypes['state'];
    navigation: NavigatorTypes['navigation'];
    descriptors: NavigatorTypes['descriptors'];
    router: RouterFactory<any, any, any>;
} | null>;
type UseNavigationBuilderRouter = Parameters<typeof useNavigationBuilder>[0];
type UseNavigationBuilderOptions = Parameters<typeof useNavigationBuilder>[1];
export type NavigatorProps<T extends UseNavigationBuilderRouter> = {
    initialRouteName?: UseNavigationBuilderOptions['initialRouteName'];
    screenOptions?: UseNavigationBuilderOptions['screenOptions'];
    children?: UseNavigationBuilderOptions['children'];
    router?: T;
    routerOptions?: Omit<Parameters<T>[0], 'initialRouteName'>;
};
/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
export declare function Navigator<T extends UseNavigationBuilderRouter>({ initialRouteName, screenOptions, children, router, routerOptions, }: NavigatorProps<T>): React.JSX.Element | null;
export declare namespace Navigator {
    var Slot: typeof import("./Navigator").Slot;
    var useContext: typeof useNavigatorContext;
    var Screen: typeof import("./Screen").Screen;
}
/**
 * @hidden
 */
export declare function useNavigatorContext(): {
    contextKey: string;
    state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>;
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
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => Readonly<{
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
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("@react-navigation/native").NavigationHelpers<import("@react-navigation/native").ParamListBase, {}> | undefined>(id?: string | undefined): T;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
        setStateForNextRouteNamesChange(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, unknown, unknown]> & import("@react-navigation/native").EventEmitter<Record<string, any>> & {
        setParams<RouteName_5 extends string>(params: Partial<object | undefined>): void;
    } & Record<string, (...args: any) => void>;
    descriptors: Record<string, import("@react-navigation/native").Descriptor<{}, Omit<{
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
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => Readonly<{
            type: string;
            payload?: object | undefined;
            source?: string | undefined;
            target?: string | undefined;
        }>)): void;
        navigate<RouteName_6 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigate<RouteName_7 extends string>(options: {
            name: string;
            params: object | undefined;
            path?: string | undefined;
            merge?: boolean | undefined;
        }): void;
        navigateDeprecated<RouteName_8 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        navigateDeprecated<RouteName_9 extends string>(options: {
            name: string;
            params: object | undefined;
            merge?: boolean | undefined;
        }): void;
        preload<RouteName_10 extends string>(...args: [screen: string] | [screen: string, params: object | undefined]): void;
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T_1 = import("@react-navigation/native").NavigationHelpers<import("@react-navigation/native").ParamListBase, {}> | undefined>(id?: string | undefined): T_1;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
        setStateForNextRouteNamesChange(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("@react-navigation/native").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
    } & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T_2 = import("@react-navigation/native").NavigationProp<import("@react-navigation/native").ParamListBase, string, undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T_2;
        setParams(params: Partial<object | undefined>): void;
        setOptions(options: Partial<{}>): void;
    } & import("@react-navigation/native").EventConsumer<Record<string, any> & import("@react-navigation/native").EventMapCore<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>>> & import("@react-navigation/native").PrivateValueStore<[import("@react-navigation/native").ParamListBase, string, Record<string, any>]> & Record<string, (...args: any) => void>, import("@react-navigation/native").RouteProp<import("@react-navigation/native").ParamListBase, string>>>;
    router: RouterFactory<any, any, any>;
};
export declare function useSlot(): JSX.Element | null;
/** Renders the currently selected content. */
export declare function Slot(props: Omit<NavigatorProps<any>, 'children'>): React.JSX.Element;
export declare function QualifiedSlot(): JSX.Element | null;
export declare function DefaultNavigator(): React.JSX.Element;
export {};
//# sourceMappingURL=Navigator.d.ts.map