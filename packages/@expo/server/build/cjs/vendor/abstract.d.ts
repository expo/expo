import type { Manifest, MiddlewareInfo, Route } from '../manifest';
import { MiddlewareModule } from '../utils/middleware';
/** Internal errors class to indicate that the server has failed
 * @remarks
 * This should be thrown for unexpected errors, so they show up as crashes.
 * Typically malformed project structure, missing manifest, html or other files.
 */
export declare class ExpoError extends Error {
    constructor(message: string);
    static isExpoError(error: unknown): error is ExpoError;
}
type ResponseInitLike = Omit<ResponseInit, 'headers'> & {
    headers: Headers;
    cf?: unknown;
    webSocket?: unknown;
};
type CallbackRouteType = 'html' | 'api' | 'notFoundHtml' | 'notAllowedApi';
type CallbackRoute = (Route & {
    type: CallbackRouteType;
}) | {
    type: null;
};
type BeforeResponseCallback = (responseInit: ResponseInitLike, route: CallbackRoute) => ResponseInitLike;
export interface RequestHandlerParams {
    getHtml: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest: () => Promise<Manifest | null>;
    getApiRoute: (route: Route) => Promise<any>;
    getMiddleware: (route: MiddlewareInfo) => Promise<MiddlewareModule>;
    handleRouteError: (error: Error) => Promise<Response>;
    /** Before handler response 4XX, not before unhandled error */
    beforeErrorResponse?: BeforeResponseCallback;
    /** Before handler responses */
    beforeResponse?: BeforeResponseCallback;
    /** Before handler HTML responses, not before 404 HTML */
    beforeHTMLResponse?: BeforeResponseCallback;
    /** Before handler API responses */
    beforeAPIResponse?: BeforeResponseCallback;
}
export declare function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, beforeErrorResponse, beforeResponse, beforeHTMLResponse, beforeAPIResponse, }: RequestHandlerParams): (request: Request) => Promise<Response>;
export {};
