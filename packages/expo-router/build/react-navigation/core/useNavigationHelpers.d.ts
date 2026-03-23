import * as React from 'react';
import { type NavigationAction, type NavigationState, type ParamListBase, type Router } from '../routers';
import { type NavigationHelpers, PrivateValueStore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
type Options<State extends NavigationState, Action extends NavigationAction> = {
    id: string | undefined;
    onAction: (action: NavigationAction) => boolean;
    onUnhandledAction: (action: NavigationAction) => void;
    getState: () => State;
    emitter: NavigationEventEmitter<any>;
    router: Router<State, Action>;
    stateRef: React.RefObject<State | null>;
};
/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods the parent screen's navigation object.
 */
export declare function useNavigationHelpers<State extends NavigationState, ActionHelpers extends Record<string, () => void>, Action extends NavigationAction, EventMap extends Record<string, any>>({ id: navigatorId, onAction, onUnhandledAction, getState, emitter, router, stateRef, }: Options<State, Action>): {
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
    }> | import("../routers").PartialState<Readonly<{
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
    getParent<T = NavigationHelpers<ParamListBase, {}> | undefined>(id?: string): T;
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
export {};
//# sourceMappingURL=useNavigationHelpers.d.ts.map