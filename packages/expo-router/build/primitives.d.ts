/// <reference types="react" />
export declare const Screen: <RouteName extends string>(_: import("@react-navigation/core").RouteConfig<import("@react-navigation/core").ParamListBase, RouteName, Readonly<{
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
        state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
    })[];
    type: string;
    stale: false;
}>, {}, import("@react-navigation/core").EventMapBase>) => null, Group: import("react").ComponentType<import("@react-navigation/core").RouteGroupConfig<import("@react-navigation/core").ParamListBase, {}>>;
//# sourceMappingURL=primitives.d.ts.map