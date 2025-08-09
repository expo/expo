import './install';
import { Manifest, Middleware, Route } from './types';
export declare function getRoutesManifest(distFolder: string): Manifest;
export declare function createRequestHandler(distFolder: string, { getRoutesManifest: getInternalRoutesManifest, getHtml, getApiRoute, getMiddleware, handleRouteError, }?: {
    getHtml?: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest?: (distFolder: string) => Promise<Manifest | null>;
    getApiRoute?: (route: Route) => Promise<any>;
    getMiddleware?: (route: Middleware) => Promise<any>;
    logApiRouteExecutionError?: (error: Error) => void;
    handleRouteError?: (error: Error) => Promise<Response>;
}): (request: Request) => Promise<Response>;
