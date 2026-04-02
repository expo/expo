import * as React from 'react';
import type { NavigationAction, NavigationState, ParamListBase, PartialState, Router } from '../routers';
import { type AddKeyedListener, type AddListener } from './NavigationBuilderContext';
import type { Descriptor, EventMapBase, NavigationHelpers, NavigationProp, RouteConfig, RouteProp } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
export type ScreenConfigWithParent<State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase> = {
    keys: (string | undefined)[];
    options: (ScreenOptionsOrCallback<ScreenOptions> | undefined)[] | undefined;
    layout: ScreenLayout<ScreenOptions> | undefined;
    props: RouteConfig<ParamListBase, string, State, ScreenOptions, EventMap, unknown>;
};
type ScreenLayout<ScreenOptions extends {}> = (props: {
    route: RouteProp<ParamListBase, string>;
    options: ScreenOptions;
    navigation: any;
    theme: ReactNavigation.Theme;
    children: React.ReactElement;
}) => React.ReactElement;
type ScreenOptionsOrCallback<ScreenOptions extends {}> = ScreenOptions | ((props: {
    route: RouteProp<ParamListBase, string>;
    navigation: any;
    theme: ReactNavigation.Theme;
}) => ScreenOptions);
type Options<State extends NavigationState, ScreenOptions extends {}, EventMap extends EventMapBase> = {
    state: State;
    screens: Record<string, ScreenConfigWithParent<State, ScreenOptions, EventMap>>;
    navigation: NavigationHelpers<ParamListBase>;
    screenOptions: ScreenOptionsOrCallback<ScreenOptions> | undefined;
    screenLayout: ScreenLayout<ScreenOptions> | undefined;
    onAction: (action: NavigationAction) => boolean;
    getState: () => State;
    setState: (state: State) => void;
    addListener: AddListener;
    addKeyedListener: AddKeyedListener;
    onRouteFocus: (key: string) => void;
    router: Router<State, NavigationAction>;
    emitter: NavigationEventEmitter<EventMap>;
};
/**
 * Hook to create descriptor objects for the child routes.
 *
 * A descriptor object provides 3 things:
 * - Helper method to render a screen
 * - Options specified by the screen for the navigator
 * - Navigation object intended for the route
 */
export declare function useDescriptors<State extends NavigationState, ActionHelpers extends Record<string, () => void>, ScreenOptions extends {}, EventMap extends EventMapBase>({ state, screens, navigation, screenOptions, screenLayout, onAction, getState, setState, addListener, addKeyedListener, onRouteFocus, router, emitter, }: Options<State, ScreenOptions, EventMap>): {
    describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => Descriptor<ScreenOptions, Omit<{
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
        getParent<T = NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): State;
    } & import("./types").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = NavigationProp<ParamListBase, string, string | undefined, Readonly<{
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
    } & import("./types").EventConsumer<EventMap & import("./types").EventMapCore<State>> & import("./types").PrivateValueStore<[ParamListBase, string, EventMap]> & ActionHelpers, RouteProp<ParamListBase>>;
    descriptors: Record<string, Descriptor<ScreenOptions, Omit<{
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
        getParent<T = NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
        getState(): State;
    } & import("./types").PrivateValueStore<[ParamListBase, unknown, unknown]>, "getParent"> & {
        getParent<T = NavigationProp<ParamListBase, string, string | undefined, Readonly<{
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
    } & import("./types").EventConsumer<EventMap & import("./types").EventMapCore<State>> & import("./types").PrivateValueStore<[ParamListBase, string, EventMap]> & ActionHelpers, RouteProp<ParamListBase>>>;
};
export {};
//# sourceMappingURL=useDescriptors.d.ts.map