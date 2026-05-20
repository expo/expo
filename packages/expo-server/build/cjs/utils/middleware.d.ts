import type { MiddlewareFunction, MiddlewareSettings } from '../types';
export interface MiddlewareModule {
    default: MiddlewareFunction;
    unstable_settings?: MiddlewareSettings;
}
/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 *
 * When `effectivePathname` differs from the raw URL pathname (e.g. the route a
 * `/_expo/loaders/...` request resolves to), patterns are checked against both
 * so route-scoped middleware can't be bypassed via the loader endpoint.
 */
export declare function shouldRunMiddleware(request: Request, middleware: MiddlewareModule, effectivePathname?: string): boolean;
