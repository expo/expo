/**
 * @description An alias for `string`, useful as a placeholder before typed routes
 * are generated in development. By using this to type routes instead of `string`,
 * you can ensure that your project remains compatible with typed routes in the
 * future.
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ export type Route<T = any> = string;
/**
 * @description A string or object representing a route—and, optionally, its query parameters—when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ export type Href<T = any> = Route | HrefObject;
/**
 * @description An object representing parsed query parameters when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ export type SearchParams<T = any> = Record<string, (string | string | number)[]>;
/**
 * @description An object representing a route and its query parameters when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ export interface HrefObject<T = any> {
    /** Path representing the selected route `/[id]`. */
    pathname?: string;
    /** Query parameters for the path. */
    params?: SearchParams<T>;
}
/** Resolve an href object into a fully qualified, relative href. */
export declare const resolveHref: (href: Href) => string;
//# sourceMappingURL=href.d.ts.map