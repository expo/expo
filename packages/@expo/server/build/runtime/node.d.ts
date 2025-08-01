import { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';
import { handleApiRouteError, logApiRouteExecutionError } from './common';
export { handleApiRouteError, logApiRouteExecutionError };
export declare const getRoutesManifest: (dist: string) => () => Promise<ExpoRoutesManifestV1<RegExp>>;
export declare const getHtml: (dist: string) => (_request: Request, route: RouteInfo<RegExp>) => Promise<string | null>;
export declare const getApiRoute: (dist: string) => (route: RouteInfo<RegExp>) => Promise<any>;
