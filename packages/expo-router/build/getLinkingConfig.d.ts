import { LinkingOptions } from '@react-navigation/native';
import { RouteNode } from './Route';
import { getInitialURL, getPathFromState } from './link/linking';
import { RequireContext } from './types';
export declare function getNavigationConfig(routes: RouteNode, metaOnly?: boolean): {
    initialRouteName: string | undefined;
    screens: Record<string, import("./getReactNavigationConfig").Screen>;
};
export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
    getPathFromState?: typeof getPathFromState;
};
export type LinkingConfigOptions = {
    metaOnly?: boolean;
    serverUrl?: string;
    getInitialURL?: typeof getInitialURL;
};
export declare function getLinkingConfig(routes: RouteNode, context: RequireContext, { metaOnly, serverUrl }?: LinkingConfigOptions): ExpoLinkingOptions;
export declare const stateCache: Map<string, any>;
//# sourceMappingURL=getLinkingConfig.d.ts.map