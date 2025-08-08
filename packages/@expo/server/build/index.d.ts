import { Manifest, Middleware, Route } from './types';
type BeforeResponseCallback = (route: Route | null, responseInit: ResponseInit) => ResponseInit;
export declare function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, beforeErrorResponse, beforeResponse, beforeHTMLResponse, beforeAPIResponse, }: {
    getHtml: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest: () => Promise<Manifest | null>;
    getApiRoute: (route: Route) => Promise<any>;
    getMiddleware?: (route: Middleware) => Promise<any>;
    handleRouteError: (error: Error) => Promise<Response>;
    beforeErrorResponse?: BeforeResponseCallback;
    beforeResponse?: BeforeResponseCallback;
    beforeHTMLResponse?: BeforeResponseCallback;
    beforeAPIResponse?: BeforeResponseCallback;
}): (request: Request) => Promise<Response>;
export {};
