import { InitialState } from '@react-navigation/native';
import * as queryString from 'query-string';
import type { InitialRouteConfig, Options, ParsedRoute, RouteConfig } from './getStateFromPath';
export type ExpoOptions = {
    previousSegments?: string[];
};
export type ExpoRouteConfig = {
    type: 'static' | 'dynamic' | 'layout';
    userReadableName: string;
    isIndex: boolean;
    isInitial?: boolean;
    hasChildren: boolean;
    expandedRouteNames: string[];
    parts: string[];
    staticPartCount: number;
};
/**
 * In Expo Router, the params are available at all levels of the routing config
 * @param routes
 * @returns
 */
export declare function populateParams(routes?: ParsedRoute[], params?: Record<string, any>): ParsedRoute[] | undefined;
export declare function safelyDecodeURIComponent(str: string): string;
export declare function getUrlWithReactNavigationConcessions(path: string, baseUrl?: string | undefined): {
    path: string;
    cleanUrl: string;
    nonstandardPathname: string;
    url: URL;
    pathWithoutGroups?: undefined;
} | {
    path: string;
    nonstandardPathname: string;
    url: URL;
    pathWithoutGroups: string;
    cleanUrl?: undefined;
};
export declare function createConfig(screen: string, pattern: string, routeNames: string[], config?: Record<string, any>): Omit<ExpoRouteConfig, 'isInitial'>;
export declare function assertScreens(options?: Options<object>): asserts options is Options<object>;
export declare function configRegExp(config: RouteConfig): RegExp | undefined;
export declare function isDynamicPart(p: string): boolean;
export declare function replacePart(p: string): string;
export declare function getParamValue(p: string, value: string): string | string[] | undefined;
export declare function handleUrlParams(route: ParsedRoute, params?: queryString.ParsedQuery): void;
export declare function spreadParamsAcrossAllStates(state: InitialState, params?: Record<string, any>): void;
export declare function stripBaseUrl(path: string, baseUrl?: string | undefined): string;
export declare function matchForEmptyPath(configs: RouteConfig[]): {
    path: string;
    type: "static" | "dynamic" | "layout";
    userReadableName: string;
    isIndex: boolean;
    isInitial?: boolean;
    hasChildren: boolean;
    expandedRouteNames: string[];
    parts: string[];
    staticPartCount: number;
    screen: string;
    regex?: RegExp;
    pattern: string;
    routeNames: string[];
    parse?: {
        [x: string]: (value: string) => any;
    };
} | undefined;
export declare function appendIsInitial(initialRoutes: InitialRouteConfig[]): (config: RouteConfig) => RouteConfig;
export declare function getRouteConfigSorter(previousSegments?: string[]): (a: RouteConfig, b: RouteConfig) => number;
export declare function parseQueryParams(path: string, route: ParsedRoute, parseConfig?: Record<string, (value: string) => any>, hash?: string): Record<string, string | string[]> | undefined;
export declare function cleanPath(path: string): string;
export declare function routePatternToRegex(pattern: string): RegExp;
//# sourceMappingURL=getStateFromPath-forks.d.ts.map