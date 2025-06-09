import { LinkingOptions } from '@react-navigation/native';
import { RouteNode } from './Route';
import { UrlObject } from './global-state/routeInfo';
import type { StoreRedirects } from './global-state/router-store';
import { getInitialURL, getPathFromState, getStateFromPath } from './link/linking';
import { RequireContext } from './types';
export declare function getNavigationConfig(routes: RouteNode, metaOnly?: boolean): {
    screens: {
        __root: {
            initialRouteName: undefined;
            screens: Record<string, import("./getReactNavigationConfig").Screen>;
            path: string;
        };
    };
};
export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
    getPathFromState: typeof getPathFromState;
    getStateFromPath: typeof getStateFromPath;
};
export type LinkingConfigOptions = {
    metaOnly?: boolean;
    serverUrl?: string;
    getInitialURL?: typeof getInitialURL;
    redirects?: StoreRedirects[];
};
export declare function getLinkingConfig(routes: RouteNode, context: RequireContext, getRouteInfo: () => UrlObject, { metaOnly, serverUrl, redirects }?: LinkingConfigOptions): ExpoLinkingOptions;
//# sourceMappingURL=getLinkingConfig.d.ts.map