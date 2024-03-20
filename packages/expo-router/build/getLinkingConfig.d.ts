import { LinkingOptions } from '@react-navigation/native';
import { RouteNode } from './Route';
import { getPathFromState } from './link/linking';
export declare function getNavigationConfig(routes: RouteNode, metaOnly?: boolean): {
    initialRouteName?: string | undefined;
    screens: import("@react-navigation/native").PathConfigMap<Record<string, unknown>>;
};
export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
    getPathFromState?: typeof getPathFromState;
};
export declare function getLinkingConfig(routes: RouteNode, overrides?: Partial<ExpoLinkingOptions>, metaOnly?: boolean): ExpoLinkingOptions;
export declare const stateCache: Map<string, any>;
//# sourceMappingURL=getLinkingConfig.d.ts.map