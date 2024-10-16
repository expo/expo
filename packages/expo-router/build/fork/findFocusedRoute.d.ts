import type { InitialState } from '@react-navigation/routers';
export declare function findFocusedRoute(state: InitialState): (Omit<import("@react-navigation/routers").Route<string, object | undefined>, "key"> & {
    state?: Readonly<Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & {
        routes: (Omit<import("@react-navigation/routers").Route<string, object | undefined>, "key"> & any)[];
    }> | undefined;
}) | undefined;
//# sourceMappingURL=findFocusedRoute.d.ts.map