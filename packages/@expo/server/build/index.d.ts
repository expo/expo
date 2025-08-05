import './install';
import { Manifest, Route } from './types';
export declare function getRoutesManifest(distFolder: string): Manifest;
export declare function createRequestHandler(distFolder: string, { getRoutesManifest: getInternalRoutesManifest, getHtml, getApiRoute, handleRouteError, }?: {
    getHtml?: (request: Request, route: Route) => Promise<string | Response | null>;
    getRoutesManifest?: (distFolder: string) => Promise<Manifest | null>;
    getApiRoute?: (route: Route) => Promise<any>;
    logApiRouteExecutionError?: (error: Error) => void;
    handleRouteError?: (error: Error) => Promise<Response>;
}): (request: Request) => Promise<Response>;
