import { type NavigationAction, type NavigationState, type ParamListBase, type Router } from '../routers';
import type { NavigationHelpers, NavigationProp } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
type Options<State extends NavigationState, ScreenOptions extends object, EventMap extends Record<string, any>> = {
    state: State;
    getState: () => State;
    navigation: NavigationHelpers<ParamListBase> & Partial<NavigationProp<ParamListBase, string, any, any, any>>;
    setOptions: (cb: (options: Record<string, ScreenOptions>) => Record<string, ScreenOptions>) => void;
    router: Router<State, NavigationAction>;
    emitter: NavigationEventEmitter<EventMap>;
};
type NavigationItem<State extends NavigationState, ScreenOptions extends object, EventMap extends Record<string, any>> = NavigationProp<ParamListBase, string, string | undefined, State, ScreenOptions, EventMap>;
type NavigationCache<State extends NavigationState, ScreenOptions extends object, EventMap extends Record<string, any>> = Record<string, NavigationItem<State, ScreenOptions, EventMap>>;
/**
 * Hook to cache navigation objects for each screen in the navigator.
 * It's important to cache them to make sure navigation objects don't change between renders.
 * This lets us apply optimizations like `React.memo` to minimize re-rendering screens.
 */
export declare function useNavigationCache<State extends NavigationState, ScreenOptions extends object, EventMap extends Record<string, any>, ActionHelpers extends Record<string, () => void>>({ state, getState, navigation, setOptions, router, emitter, }: Options<State, ScreenOptions, EventMap>): {
    base: Omit<{
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
        reset(state: State | import("../routers").PartialState<State>): void;
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
    } & import("./types").EventConsumer<EventMap & import("./types").EventMapCore<State>> & import("./types").PrivateValueStore<[ParamListBase, string, EventMap]> & ActionHelpers;
    navigations: NavigationCache<State, ScreenOptions, EventMap>;
};
export {};
//# sourceMappingURL=useNavigationCache.d.ts.map