import '@expo/server/install';
import { Response } from '@remix-run/node';
import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';
import { ExpoRequest, ExpoResponse } from './environment';
export declare function getRoutesManifest(distFolder: string): ExpoRoutesManifestV1<RegExp>;
export declare function createRequestHandler(distFolder: string, { getRoutesManifest: getInternalRoutesManifest, getHtml, getApiRoute, logApiRouteExecutionError, }?: {
    getHtml?: (request: ExpoRequest, route: RouteInfo<RegExp>) => Promise<string | ExpoResponse | null>;
    getRoutesManifest?: (distFolder: string) => Promise<ExpoRoutesManifestV1<RegExp> | null>;
    getApiRoute?: (route: RouteInfo<RegExp>) => Promise<any>;
    logApiRouteExecutionError?: (error: Error) => void;
}): (request: ExpoRequest) => Promise<Response>;
export { ExpoResponse, ExpoRequest };
