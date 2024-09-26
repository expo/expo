import '@expo/server/install';
import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';
export declare function getRoutesManifest(distFolder: string): ExpoRoutesManifestV1<RegExp>;
export declare function createRequestHandler(distFolder: string, { getRoutesManifest: getInternalRoutesManifest, getHtml, getApiRoute, logApiRouteExecutionError, handleApiRouteError, }?: {
    getHtml?: (request: Request, route: RouteInfo<RegExp>) => Promise<string | Response | null>;
    getRoutesManifest?: (distFolder: string) => Promise<ExpoRoutesManifestV1<RegExp> | null>;
    getApiRoute?: (route: RouteInfo<RegExp>) => Promise<any>;
    logApiRouteExecutionError?: (error: Error) => void;
    handleApiRouteError?: (error: Error) => Promise<Response>;
}): (request: Request) => Promise<Response>;
