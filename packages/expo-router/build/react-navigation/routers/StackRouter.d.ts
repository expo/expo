import type { DefaultRouterOptions, NavigationRoute, NavigationState, ParamListBase, Router } from './types';
export type StackActionType = {
    type: 'REPLACE';
    payload: {
        name: string;
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: 'PUSH';
    payload: {
        name: string;
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: 'POP';
    payload: {
        count: number;
    };
    source?: string;
    target?: string;
} | {
    type: 'POP_TO_TOP';
    source?: string;
    target?: string;
} | {
    type: 'POP_TO';
    payload: {
        name: string;
        params?: object;
        merge?: boolean;
    };
    source?: string;
    target?: string;
};
export type StackRouterOptions = DefaultRouterOptions;
export type StackNavigationState<ParamList extends ParamListBase> = NavigationState<ParamList> & {
    /**
     * Type of the router, in this case, it's stack.
     */
    type: 'stack';
    /**
     * List of routes, which are supposed to be preloaded before navigating to.
     */
    preloadedRoutes: NavigationRoute<ParamList, keyof ParamList>[];
};
export type StackActionHelpers<ParamList extends ParamListBase> = {
    /**
     * Replace the current route with a new one.
     *
     * @param screen Name of the new route that will replace the current one.
     * @param [params] Params object for the new route.
     */
    replace<RouteName extends keyof ParamList>(...args: RouteName extends unknown ? undefined extends ParamList[RouteName] ? [screen: RouteName, params?: ParamList[RouteName]] : [screen: RouteName, params: ParamList[RouteName]] : never): void;
    /**
     * Push a new screen onto the stack.
     *
     * @param screen Name of the route to push onto the stack.
     * @param [params] Params object for the route.
     */
    push<RouteName extends keyof ParamList>(...args: RouteName extends unknown ? undefined extends ParamList[RouteName] ? [screen: RouteName, params?: ParamList[RouteName]] : [screen: RouteName, params: ParamList[RouteName]] : never): void;
    /**
     * Pop a screen from the stack.
     */
    pop(count?: number): void;
    /**
     * Pop to the first route in the stack, dismissing all other screens.
     */
    popToTop(): void;
    /**
     * Pop any screens to go back to the specified screen.
     * If the specified screen doesn't exist, it'll be added to the stack.
     *
     * @param screen Name of the route to pop to.
     * @param [params] Params object for the route.
     * @param [options.merge] Whether to merge the params onto the route. Defaults to `false`.
     */
    popTo<RouteName extends keyof ParamList>(...args: RouteName extends unknown ? undefined extends ParamList[RouteName] ? [screen: RouteName, params?: ParamList[RouteName], options?: {
        merge?: boolean;
    }] : [screen: RouteName, params: ParamList[RouteName], options?: {
        merge?: boolean;
    }] : never): void;
};
export declare const StackActions: {
    replace(name: string, params?: object): {
        readonly type: "REPLACE";
        readonly payload: {
            readonly name: string;
            readonly params: object | undefined;
        };
    };
    push(name: string, params?: object): {
        readonly type: "PUSH";
        readonly payload: {
            readonly name: string;
            readonly params: object | undefined;
        };
    };
    pop(count?: number): {
        readonly type: "POP";
        readonly payload: {
            readonly count: number;
        };
    };
    popToTop(): {
        readonly type: "POP_TO_TOP";
    };
    popTo(name: string, params?: object, options?: {
        merge?: boolean;
    }): {
        readonly type: "POP_TO";
        readonly payload: {
            readonly name: string;
            readonly params: object | undefined;
            readonly merge: boolean | undefined;
        };
    };
};
export declare function StackRouter(options: StackRouterOptions): Router<StackNavigationState<ParamListBase>, import("./CommonActions").Action | StackActionType>;
//# sourceMappingURL=StackRouter.d.ts.map