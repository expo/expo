import type { MiddlewareFunction, MiddlewareSettings } from '../types';
export interface MiddlewareModule {
    default: MiddlewareFunction;
    unstable_settings?: MiddlewareSettings;
}
/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 */
export declare function shouldRunMiddleware(request: Request, middleware: MiddlewareModule): boolean;
