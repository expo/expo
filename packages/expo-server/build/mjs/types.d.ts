import type { _ImmutableHeaders, _ImmutableRequest } from './ImmutableRequest';
/**
 * An immutable version of the Fetch API's `Headers` object. It cannot be mutated or modified.
 */
export interface ImmutableHeaders extends _ImmutableHeaders {
}
/**
 * An immutable version of the Fetch API's `Request` object. It cannot be mutated or modified, its
 * headers are immutable, and you won't have access to the request body.
 */
export interface ImmutableRequest extends _ImmutableRequest {
    readonly url: string;
    readonly method: string;
}
/**
 * Middleware function type. Middleware run for every request in your app, or on
 * specified conditionally matched methods and path patterns, as per {@link MiddlewareMatcher}.
 * @param request - An `ImmutableRequest` with read-only headers and no body access
 * @example
 * ```ts
 * import type { MiddlewareFunction } from 'expo-server';
 *
 * const middleware: MiddlewareFunction = async (request) => {
 *   console.log(`Middleware executed for: ${request.url}`);
 * };
 *
 * export default middleware;
 * ```
 * @see [Server middleware](https://docs.expo.dev/router/web/middleware/) for more information.
 */
export type MiddlewareFunction = (request: ImmutableRequest) => Promise<Response | void> | Response | void;
/** Middleware matcher settings that restricts the middleware to run conditionally. */
export interface MiddlewareMatcher {
    /** Set this to a list of path patterns to conditionally run middleware on. This may be exact paths,
     * paths containing parameter or catch-all segments (`'/posts/[postId]'` or `'/blog/[...slug]'`), or
     * regular expressions matching paths.
     * @example ['/api', '/posts/[id]', '/blog/[...slug]']
     */
    patterns?: (string | RegExp)[];
    /** Set this to a list of HTTP methods to conditionally run middleware on. By default, middleware will
     * match all HTTP methods.
     * @example ['POST', 'PUT', 'DELETE']
     */
    methods?: string[];
}
/** Exported from a `+middleware.ts` file to configure the server-side middleware function.
 * @example
 * ```ts
 * import type { MiddlewareSettings } from 'expo-server';
 *
 * export const unstable_settings: MiddlewareSettings = {
 *   matcher: {
 *     methods: ['GET'],
 *     patterns: ['/api', '/admin/[...path]'],
 *   },
 * };
 * ```
 * @see https://docs.expo.dev/router/reference/middleware/
 */
export interface MiddlewareSettings {
    /** Matcher definition that restricts the middleware to run conditionally. */
    matcher?: MiddlewareMatcher;
}
/**
 * Function type for route loaders. Loaders are executed on the server during
 * SSR/SSG to fetch data required by a route.
 *
 * During SSG (Static Site Generation), the `request` parameter will be `undefined`
 * as there is no HTTP request at build time.
 *
 * @param request - An `ImmutableRequest` with read-only headers and no body access. In SSG, this is `undefined`
 * @param params - Route parameters extracted from the URL path
 * @example
 * ```ts
 * import type { LoaderFunction } from 'expo-server';
 *
 * export const loader: LoaderFunction = async (request, params) => {
 *   const data = await fetchData(params.id);
 *   return { data };
 * };
 * ```
 * @see [Data loaders](/router/web/data-loaders) for more information.
 */
export type LoaderFunction<T = any> = (request: ImmutableRequest | undefined, params: Record<string, string | string[]>) => Promise<T> | T;
