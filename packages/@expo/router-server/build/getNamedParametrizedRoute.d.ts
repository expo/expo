export declare function getNamedParametrizedRoute(route: string): {
    namedParameterizedRoute: string;
    routeKeys: Record<string, string>;
    /** Cleaned route-key names whose captures should be split into arrays (wildcards). */
    wildcardKeys: Set<string>;
};
export declare function parseParameter(param: string): {
    name: string;
    repeat: boolean;
    optional: boolean;
};
//# sourceMappingURL=getNamedParametrizedRoute.d.ts.map