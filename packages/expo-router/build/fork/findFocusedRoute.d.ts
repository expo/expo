import type { InitialState } from "@react-navigation/routers";
export declare function findFocusedRoute(state: InitialState): (Omit<import("@react-navigation/routers").Route<string, object | undefined>, "key"> & {
    state?: Readonly<Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/routers").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & {
        routes: (Omit<import("@react-navigation/routers").Route<string, object | undefined>, "key"> & any)[];
    }> | undefined;
}) | undefined;
//# sourceMappingURL=findFocusedRoute.d.ts.map