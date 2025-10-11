import type { _ImmutableRequest } from './ImmutableRequest';
/** An immutable version of the Fetch API's `Request` as received by middleware functions.
 * It cannot be mutated or modified, its headers are immutable, and you won't have access to the request body.
 */
export interface ImmutableRequest extends _ImmutableRequest {
    readonly url: string;
    readonly method: string;
}
/**
 * Middleware function type. Middleware run for every request in your app, or on
 * specified conditonally matched methods and path patterns, as per {@link MiddlewareMatcher}.
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
 * @see https://docs.expo.dev/router/reference/middleware/
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
