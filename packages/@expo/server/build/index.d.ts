import './install';
import { Manifest, Middleware, Route } from './types';
export declare function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, }: {
    getHtml: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest: () => Promise<Manifest | null>;
    getApiRoute: (route: Route) => Promise<any>;
    getMiddleware?: (route: Middleware) => Promise<any>;
    handleRouteError: (error: Error) => Promise<Response>;
}): (request: Request) => Promise<Response>;
