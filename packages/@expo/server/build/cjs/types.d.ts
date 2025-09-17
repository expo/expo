import type { ExpoRoutesManifestV1, MiddlewareInfo, RouteInfo } from 'expo-router/build/routes-manifest';
import type { _ImmutableRequest } from './ImmutableRequest';
export type RawManifest = ExpoRoutesManifestV1;
export type Manifest = ExpoRoutesManifestV1<RegExp>;
export type Middleware = MiddlewareInfo;
export type Route = RouteInfo<RegExp>;
/**
 * An immutable version of the Fetch API's [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object which prevents mutations to the request body and headers.
 */
interface ImmutableRequest extends _ImmutableRequest {
}
/**
 * Middleware pattern type that can be a string (including named params) or a regular expression.
 *
 * @example
 * // Exact match
 * '/api'
 * @example
 * // Named parameters
 * '/posts/[postId]'              // Single dynamic segment
 * '/blog/[...slug]'              // Catch-all segments
 * '/users/[userId]/posts/[postId]' // Multiple parameters
 * @example
 * // Regular expression
 * /^\/api\/v\d+\/users$/
 */
export type MiddlewarePattern = string | RegExp;
export type MiddlewareMatcher = {
    /**
     * Array of path patterns to match against. Supports exact paths, paths with named parameters, and regex patterns.
     */
    patterns?: MiddlewarePattern[];
    /**
     * HTTP methods to match (undefined = all methods)
     * @example ['POST', 'PUT', 'DELETE']
     */
    methods?: string[];
};
/**
 * Middleware function type that runs before route matching.
 * Can return a Response to short-circuit the request, or void/undefined to continue.
 *
 * @param request - An `ImmutableRequest` with read-only headers and no body access
 */
export type MiddlewareFunction = (request: ImmutableRequest) => Promise<Response | void> | Response | void;
export type MiddlewareModule = {
    default: MiddlewareFunction;
    unstable_settings?: {
        matcher?: MiddlewareMatcher;
    };
};
export {};
