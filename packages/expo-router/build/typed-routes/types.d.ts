/**
 * The main routing type for Expo Router.
 *
 * @internal
 */
export declare namespace ExpoRouter {
    interface __routes<T extends string | object = string> {
    }
}
export type RelativePathString = `./${string}` | `../${string}` | '..';
export type SearchOrHash = `?${string}` | `#${string}`;
export type ExternalPathString = `${string}:${string}` | `//${string}`;
/**
 * The main routing type for Expo Router. Includes all available routes with strongly typed parameters.
 *
 * A Href can either be a string or an object.
 *
 * The generic will be removed in 4.0
 */
export type Href<T extends string | object = string> = ExpoRouter.__routes<T> extends {
    Href: any;
} ? ExpoRouter.__routes<T>['Href'] : string | {
    pathname: string;
    params?: UnknownInputParams;
};
export type HrefParams<T extends string> = ExpoRouter.__routes<T> extends {
    HrefParams: Record<string, object>;
} ? ExpoRouter.__routes<T>['HrefParams'][T] : Record<string, UnknownInputParams>;
/**
 * Routes can have known inputs (e.g query params)
 * Unlike outputs, inputs can be undefined or null
 */
export type UnknownInputParams = Record<string, string | number | undefined | null | (string | number)[]>;
/**
 * Routes can have unknown outputs (e.g query params)
 * Unlike inputs, outputs can't be undefined or null
 */
export type UnknownOutputParams = Record<string, string | string[]>;
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
export type RouteParams<Path extends string> = HrefParams<Path>;
/**
 * @deprecated Use RouteParams or StrictRouteParams instead
 */
export type SearchParams<T extends string = never> = RouteParams<T>;
export type RouteSegments<PathOrStringArray extends string | string[]> = PathOrStringArray extends string[] ? PathOrStringArray : PathOrStringArray extends `/${infer PartA}` ? RouteSegments<PartA> : PathOrStringArray extends `${infer PartA}/${infer PartB}` ? [PartA, ...RouteSegments<PartB>] : [PathOrStringArray];
//# sourceMappingURL=types.d.ts.map