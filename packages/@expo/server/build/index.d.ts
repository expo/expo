import './install';
import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';
export declare function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, logApiRouteExecutionError, handleApiRouteError, }: {
    getHtml: (request: Request, route: RouteInfo<RegExp>) => Promise<string | Response | null>;
    getRoutesManifest: () => Promise<ExpoRoutesManifestV1<RegExp> | null>;
    getApiRoute: (route: RouteInfo<RegExp>) => Promise<any>;
    logApiRouteExecutionError: (error: Error) => void;
    handleApiRouteError: (error: Error) => Promise<Response>;
}): (request: Request) => Promise<Response>;
