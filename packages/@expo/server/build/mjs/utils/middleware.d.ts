import type { MiddlewareModule } from '../types';
/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 */
export declare function shouldRunMiddleware(request: Request, middleware: MiddlewareModule): boolean;
