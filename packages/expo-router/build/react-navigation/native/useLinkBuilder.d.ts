/**
 * Helper to build a href for a screen based on the linking options.
 */
export declare function useBuildHref(): (name: string, params?: object) => string | undefined;
/**
 * Helper to build a navigation action from a href based on the linking options.
 */
export declare const useBuildAction: () => (href: string) => {
    type: "GO_BACK";
    source?: string;
    target?: string;
} | {
    type: "NAVIGATE";
    payload: {
        name: string;
        params?: object;
        path?: string;
        merge?: boolean;
        pop?: boolean;
    };
    source?: string;
    target?: string;
} | {
    type: "NAVIGATE_DEPRECATED";
    payload: {
        name: string;
        params?: object;
        merge?: boolean;
    };
    source?: string;
    target?: string;
} | {
    type: "SET_PARAMS";
    payload: {
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: "REPLACE_PARAMS";
    payload: {
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: "PRELOAD";
    payload: {
        name: string;
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    readonly type: "RESET";
    readonly payload: (Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
        type: string;
        stale: false;
    }> | import("../core").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | (Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "routes"> & {
        routes: Omit<import("../core").Route<string>, "key">[];
    })) | undefined;
} | {
    type: "NAVIGATE";
    payload: {
        name: string;
        params?: import("../core").NavigatorScreenParams<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
            type: string;
            stale: false;
        }>>;
        path?: string;
    };
};
/**
 * Helpers to build href or action based on the linking options.
 *
 * @returns `buildHref` to build an `href` for screen and `buildAction` to build an action from an `href`.
 */
export declare function useLinkBuilder(): {
    buildHref: (name: string, params?: object) => string | undefined;
    buildAction: (href: string) => {
        type: "GO_BACK";
        source?: string;
        target?: string;
    } | {
        type: "NAVIGATE";
        payload: {
            name: string;
            params?: object;
            path?: string;
            merge?: boolean;
            pop?: boolean;
        };
        source?: string;
        target?: string;
    } | {
        type: "NAVIGATE_DEPRECATED";
        payload: {
            name: string;
            params?: object;
            merge?: boolean;
        };
        source?: string;
        target?: string;
    } | {
        type: "SET_PARAMS";
        payload: {
            params?: object;
        };
        source?: string;
        target?: string;
    } | {
        type: "REPLACE_PARAMS";
        payload: {
            params?: object;
        };
        source?: string;
        target?: string;
    } | {
        type: "PRELOAD";
        payload: {
            name: string;
            params?: object;
        };
        source?: string;
        target?: string;
    } | {
        readonly type: "RESET";
        readonly payload: (Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
            type: string;
            stale: false;
        }> | import("../core").PartialState<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
            type: string;
            stale: false;
        }>> | (Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "routes"> & {
            routes: Omit<import("../core").Route<string>, "key">[];
        })) | undefined;
    } | {
        type: "NAVIGATE";
        payload: {
            name: string;
            params?: import("../core").NavigatorScreenParams<Readonly<{
                key: string;
                index: number;
                routeNames: string[];
                history?: unknown[];
                routes: import("../core").NavigationRoute<import("../core").ParamListBase, string>[];
                type: string;
                stale: false;
            }>>;
            path?: string;
        };
    };
};
//# sourceMappingURL=useLinkBuilder.d.ts.map