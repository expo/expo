type HasTypedRoutes = ExpoRouter.__routes extends {
    StaticRoutes: string;
} ? true : false;
export type StaticRoutes = ExpoRouter.__routes extends {
    StaticRoutes: string;
} ? ExpoRouter.__routes['StaticRoutes'] : string;
export type DynamicRoutes<T extends string> = ExpoRouter.__routes<T> extends {
    DynamicRoutes: any;
} ? T extends ExpoRouter.__routes<infer _>['DynamicRoutes'] ? T : never : string;
export type DynamicRouteTemplate = ExpoRouter.__routes extends {
    DynamicRouteTemplate: string;
} ? ExpoRouter.__routes['DynamicRouteTemplate'] : string;
/**
 * The main routing type for Expo Router.
 *
 * @internal
 */
export declare namespace ExpoRouter {
    interface __routes<T extends string = string> extends Record<string, unknown> {
    }
}
export type Routes = DynamicRouteTemplate | AllUngroupedRoutes<StaticRoutes>;
/**
 * The main routing type for Expo Router. Includes all available routes with strongly typed parameters.
 *
 * A Href can either be a string or an object.
 *
 * Href accepts an optional T parameter to correctly type dynamic routes string. For example: Without the generic the route `/folder/[slug]` will be typed as `/folder/${string}`, which is incorrect as `/folder/apple/orange` would be valid. But by passing desired route as a generic `Href<'/folder/apple'>`, it will validate against this edge case.
 *
 */
export type Href<T extends string | object = {
    __branded__: any;
}> = StaticRouteToHrefString<AllUngroupedRoutes<StaticRoutes> | RelativePathString | ExternalPathString> | StaticRouteToHrefObject<AllUngroupedRoutes<StaticRoutes> | RelativePathString | ExternalPathString> | DynamicRouteString<T, DynamicRouteTemplate> | DynamicTemplateToHrefObject<DynamicRouteTemplate>;
/**
 * Converts a static route to a Href string type
 */
type StaticRouteToHrefString<T extends string = string> = T | `${T}${SearchOrHash}`;
/**
 * Converts a static route to a Href object
 */
type StaticRouteToHrefObject<T extends string = string> = T extends any ? {
    pathname: T;
    params?: RouteParamInput<T> | never;
} : never;
/**
 * Converts a dynamic route template to a Href string type
 */
type DynamicRouteString<T extends string | object, P = DynamicRouteTemplate> = '__branded__' extends keyof T ? DynamicTemplateToHrefString<P> : T extends string ? DynamicRoutes<T> : never;
export type DynamicTemplateToHrefString<Path> = Path extends `${infer PartA}/${infer PartB}` ? `${PartA extends `[${string}]` ? string : PartA}/${DynamicTemplateToHrefString<PartB>}` : Path extends `[${string}]` ? string : Path;
/**
 * Converts a dynamic route object to a Href object
 */
type DynamicTemplateToHrefObject<T extends string> = T extends string ? {
    pathname: T;
    params: RouteParamInput<T>;
} : never;
/****************
 * Route Utils  *
 ****************/
type RelativePathString = `./${string}` | `../${string}` | '..';
type SearchOrHash = `?${string}` | `#${string}`;
type ExternalPathString = `${string}:${string}`;
/**
 * Given a route. Returns a union of both that route with and without the groups
 *
 * The type is recursive and will provide a union of all possible routes
 */
type AllUngroupedRoutes<Path> = Path extends `(${infer PartA})/${infer PartB}` ? `(${PartA})/${AllUngroupedRoutes<PartB>}` | AllUngroupedRoutes<PartB> : Path;
/**
 * Routes can have known inputs (e.g query params)
 * Unlike outputs, inputs can be undefined or null
 */
type UnknownInputParams = Record<string, string | number | undefined | null | (string | number)[]>;
/**
 * Routes can have unknown outputs (e.g query params)
 * Unlike inputs, outputs can't be undefined or null
 */
export type UnknownOutputParams = Record<string, string | string[]>;
/**
 * Return the name of a route parameter
 * '[test]'    -> 'test'
 * 'test'      -> never
 * '[...test]' -> '...test'
 */
type IsParameter<Part> = Part extends `[${infer ParamName}]` ? ParamName : never;
/**
 * Return a union of all raw parameter names. If there are no names return never
 *
 * This differs from ParameterNames as it returns the `...` for catch all parameters
 *
 * /[test]         -> 'test'
 * /[abc]/[...def] -> 'abc'|'...def'
 */
type ParameterNames<Path> = Path extends `${infer PartA}/${infer PartB}` ? PartA extends '.' ? ParameterNames<PartB> : IsParameter<PartA> | ParameterNames<PartB> : IsParameter<Path>;
/**
 * Return only the RoutePart of a string. If the string has multiple parts return never
 *
 * string   | type
 * ---------|------
 * 123      | 123
 * /123/abc | never
 * 123?abc  | never
 * ./123    | never
 * /123     | never
 * 123/../  | never
 */
export type SingleRoutePart<S extends string> = S extends `${string}/${string}` ? never : S extends `${string}${SearchOrHash}` ? never : S extends '' ? never : S extends `(${string})` ? never : S extends `[${string}]` ? never : S;
/**
 * Returns a Record of the routes parameters as strings and CatchAll parameters
 *
 * There are two versions, input and output, as you can input 'string | number' but
 *  the output will always be 'string'
 *
 * /[id]/[...rest] -> { id: string, rest: string[] }
 * /no-params      -> {}
 */
export type StrictRouteParamsInputs<Path> = {
    [Key in ParameterNames<Path> as Key extends `...${infer Name}` ? Name : Key]: Key extends `...${string}` ? (string | number)[] : string | number;
};
/**
 * Returns a Record of the routes parameters as strings and CatchAll parameters
 *
 * There are two versions, input and output, as you can input 'string | number' but
 *  the output will always be 'string'
 *
 * /[id]/[...rest] -> { id: string, rest: string[] }
 * /no-params      -> {}
 *
 * @see {@link StrictRouteParamsInputs} for the input version
 */
export type StrictRouteParamsOutput<Path> = {
    [Key in ParameterNames<Path> as Key extends `...${infer Name}` ? Name : Key]: Key extends `...${string}` ? string[] : string;
};
export type RouteParamInput<Path> = StrictRouteParamsInputs<Path> & UnknownInputParams;
export type RouteParams<PathOrObject extends Routes | UnknownOutputParams, ExtraPathOrObject extends UnknownOutputParams = UnknownOutputParams> = PathOrObject extends string ? StrictRouteParamsOutput<PathOrObject> & ExtraPathOrObject : PathOrObject;
/**
 * @deprecated Use RouteParams or StrictRouteParams instead
 */
export type SearchParams<T extends string = never> = RouteParams<T>;
export type RouteSegments<PathOrStringArray extends string | string[]> = PathOrStringArray extends string[] ? PathOrStringArray : PathOrStringArray extends `/${infer PartA}` ? RouteSegments<PartA> : PathOrStringArray extends `${infer PartA}/${infer PartB}` ? [PartA, ...RouteSegments<PartB>] : HasTypedRoutes extends true ? [PathOrStringArray] : string[];
export {};
//# sourceMappingURL=types.d.ts.map