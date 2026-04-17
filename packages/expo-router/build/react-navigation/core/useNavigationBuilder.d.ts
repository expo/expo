import * as React from 'react';
import { type DefaultRouterOptions, type NavigationAction, type NavigationState, type ParamListBase, type PartialState, type RouterFactory } from '../routers';
import { type DefaultNavigatorOptions, type EventMapCore, PrivateValueStore } from './types';
/**
 * Hook for building navigators.
 *
 * @param createRouter Factory method which returns router object.
 * @param options Options object containing `children` and additional options for the router.
 * @returns An object containing `state`, `navigation`, `descriptors` objects.
 */
export declare function useNavigationBuilder<State extends NavigationState, RouterOptions extends DefaultRouterOptions, ActionHelpers extends Record<string, (...args: any) => void>, ScreenOptions extends object, EventMap extends Record<string, any>>(createRouter: RouterFactory<State, NavigationAction, RouterOptions>, options: DefaultNavigatorOptions<ParamListBase, string | undefined, State, ScreenOptions, EventMap, any> & RouterOptions): {
    state: State;
    navigation: {
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
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>) => Readonly<{
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
        reset(state: Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }> | PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("./types").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>;
    } & PrivateValueStore<[ParamListBase, unknown, unknown]> & import("./types").EventEmitter<EventMap> & {
        setParams(params: Partial<object | undefined>): void;
        replaceParams(params: object | undefined): void;
    } & ActionHelpers;
    describe: (route: import("./types").RouteProp<ParamListBase>, placeholder: boolean) => import("./types").Descriptor<ScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }> | ((state: Readonly<State>) => Readonly<{
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
        reset(state: State | PartialState<State>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("./types").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): State;
    } & PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = import("./types").NavigationProp<ParamListBase, string, string | undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T;
        setOptions(options: Partial<ScreenOptions>): void;
    } & {
        setParams(params: Partial<object | undefined>): void;
        replaceParams(params: object | undefined): void;
    } & import("./types").EventConsumer<EventMap & EventMapCore<State>> & PrivateValueStore<[ParamListBase, string, EventMap]> & ActionHelpers, import("./types").RouteProp<ParamListBase>>;
    descriptors: Record<string, import("./types").Descriptor<ScreenOptions, Omit<{
        dispatch(action: Readonly<{
            type: string;
            payload?: object;
            source?: string;
            target?: string;
        }> | ((state: Readonly<State>) => Readonly<{
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
        reset(state: State | PartialState<State>): void;
        goBack(): void;
        isFocused(): boolean;
        canGoBack(): boolean;
        getId(): string | undefined;
        getParent<T = import("./types").NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): State;
    } & PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = import("./types").NavigationProp<ParamListBase, string, string | undefined, Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../routers").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, {}, {}> | undefined>(id?: string | undefined): T;
        setOptions(options: Partial<ScreenOptions>): void;
    } & {
        setParams(params: Partial<object | undefined>): void;
        replaceParams(params: object | undefined): void;
    } & import("./types").EventConsumer<EventMap & EventMapCore<State>> & PrivateValueStore<[ParamListBase, string, EventMap]> & ActionHelpers, import("./types").RouteProp<ParamListBase>>>;
    NavigationContent: ({ children }: {
        children: React.ReactNode;
    }) => React.JSX.Element;
};
//# sourceMappingURL=useNavigationBuilder.d.ts.map