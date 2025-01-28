import { type Route } from '@react-navigation/native';
import type { Options, State, StringifyConfig } from './getPathFromState';
export type ExpoOptions = {
    preserveDynamicRoutes?: boolean;
    preserveGroups?: boolean;
    shouldEncodeURISegment?: boolean;
};
export type ExpoConfigItem = {
    initialRouteName?: string;
};
export declare function validatePathConfig<ParamList extends object>({ preserveDynamicRoutes, preserveGroups, shouldEncodeURISegment, ...options }: Options<ParamList>): void;
export declare function fixCurrentParams(allParams: Record<string, any>, route: Route<string> & {
    state?: State;
}, stringify?: StringifyConfig): {
    [k: string]: string | string[];
};
export declare function appendQueryAndHash(path: string, { '#': hash, ...focusedParams }: Record<string, any>): string;
export declare function appendBaseUrl(path: string, baseUrl?: string | undefined): string;
export declare function getPathWithConventionsCollapsed({ pattern, route, params, preserveGroups, preserveDynamicRoutes, shouldEncodeURISegment, initialRouteName, }: ExpoOptions & {
    pattern: string;
    route: Route<any>;
    params: Record<string, any>;
    initialRouteName?: string;
}): string;
export declare const getParamName: (pattern: string) => string;
export declare function isDynamicPart(p: string): boolean;
//# sourceMappingURL=getPathFromState-forks.d.ts.map