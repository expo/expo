import { Manifest, Middleware, Route } from './types';
/**
 * @deprecated Use Fetch API `Request` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request)
 */
type ExpoRequest = Request;
/**
 * @deprecated Use Fetch API `Response` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response)
 */
type ExpoResponse = Request;
export { ExpoRequest, ExpoResponse };
export { ExpoError } from './error';
export { type MiddlewareFunction } from './types';
type ResponseInitLike = Omit<ResponseInit, 'headers'> & {
    headers: Record<string, string>;
};
type BeforeResponseCallback = (route: Route | null, responseInit: ResponseInitLike) => ResponseInitLike;
export declare function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, beforeErrorResponse, beforeResponse, beforeHTMLResponse, beforeAPIResponse, }: {
    getHtml: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest: () => Promise<Manifest | null>;
    getApiRoute: (route: Route) => Promise<any>;
    getMiddleware: (route: Middleware) => Promise<any>;
    handleRouteError: (error: Error) => Promise<Response>;
    beforeErrorResponse?: BeforeResponseCallback;
    beforeResponse?: BeforeResponseCallback;
    beforeHTMLResponse?: BeforeResponseCallback;
    beforeAPIResponse?: BeforeResponseCallback;
}): (request: Request) => Promise<Response>;
