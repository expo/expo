/**
 * The main routing type for Expo Router.
 *
 * @internal
 * @hidden
 */
export declare namespace ExpoRouter {
    interface __routes {
    }
}
export type RelativePathString = `./${string}` | `../${string}` | '..';
export type SearchOrHash = `?${string}` | `#${string}`;
export type ExternalPathString = `${string}:${string}` | `//${string}`;
export type Route = Exclude<Extract<Href, object>['pathname'], // Use the HrefObject, as it doesn't have query params
// Use the HrefObject, as it doesn't have query params
RelativePathString | ExternalPathString>;
/**
 * The main routing type for Expo Router. It includes all available routes with strongly
 * typed parameters. It can either be:
 * - **string**: A full path like `/profile/settings` or a relative path like `../settings`.
 * - **object**: An object with a `pathname` and optional `params`. The `pathname` can be
 * a full path like `/profile/settings` or a relative path like `../settings`.
 * The params can be an object of key-value pairs.
 *
 * A Href can either be a string or an object.
 */
export type Href = ExpoRouter.__routes extends {
    href: any;
} ? ExpoRouter.__routes['href'] : string | {
    pathname: string;
    params?: UnknownInputParams;
};
export type HrefInputParams = ExpoRouter.__routes extends {
    hrefInputParams: any;
} ? ExpoRouter.__routes['hrefInputParams'] : {
    pathname: string;
    params?: UnknownInputParams;
};
export type HrefOutputParams = ExpoRouter.__routes extends {
    hrefOutputParams: any;
} ? ExpoRouter.__routes['hrefOutputParams'] : {
    pathname: string;
    params?: UnknownOutputParams;
};
export type RouteInputParams<T extends Route> = Extract<Href, {
    pathname: T;
}> extends never ? HrefInputParams extends infer H ? H extends Record<'pathname' | 'params', any> ? T extends H['pathname'] ? H['params'] : never : never : never : Extract<HrefInputParams, {
    pathname: T;
}>['params'];
export type RouteOutputParams<T extends Route> = Extract<HrefOutputParams, {
    pathname: T;
}> extends never ? HrefOutputParams extends infer H ? H extends Record<'pathname' | 'params', any> ? T extends H['pathname'] ? H['params'] : never : never : never : Extract<HrefOutputParams, {
    pathname: T;
}>['params'];
export type RouteParams<T extends Route> = RouteOutputParams<T>;
/**
 * Routes can have known inputs (e.g query params).
 * Unlike outputs, inputs can be `undefined` or `null`.
 *
 * @hidden
 */
export type UnknownInputParams = Record<string, string | number | undefined | null | (string | number)[]>;
/**
 * Routes can have unknown outputs (e.g query params).
 * Unlike inputs, outputs can't be undefined or null.
 *
 * @hidden
 */
export type UnknownOutputParams = Record<string, string | string[]>;
/**
 * Return only the RoutePart of a string. If the string has multiple parts return never
 *
 * string   | type
 *| ---------|------|
 *| 123      | 123 |
 *| /123/abc | never |
 *| 123?abc  | never |
 *| ./123    | never |
 *| /123     | never |
 *| 123/../  | never |
 *
 * @hidden
 */
export type SingleRoutePart<S extends string | object> = S extends object ? never : S extends `${string}/${string}` ? never : S extends `${string}${SearchOrHash}` ? never : S extends '' ? never : S extends `(${string})` ? never : S extends `[${string}]` ? never : S;
/**
 * @deprecated Use `RouteParams` or `StrictRouteParams` instead.
 *
 * @hidden
 */
export type SearchParams<T extends string = never> = RouteParams<T>;
/**
 * @hidden
 */
export type RouteSegments<HrefOrSegments extends Route | string[]> = HrefOrSegments extends string[] ? HrefOrSegments : HrefOrSegments extends `.${string}` ? never : HrefOrSegments extends `` ? never : HrefOrSegments extends `/${infer PartA}` ? RouteSegments<PartA> : HrefOrSegments extends `${infer PartA}?${string}` ? RouteSegments<PartA> : HrefOrSegments extends `${infer PartA}#${string}` ? RouteSegments<PartA> : HrefOrSegments extends `${infer PartA}/${infer PartB}` ? [PartA, ...RouteSegments<PartB>] : [HrefOrSegments];
//# sourceMappingURL=types.d.ts.map