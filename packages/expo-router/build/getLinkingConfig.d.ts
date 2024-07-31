import { LinkingOptions } from '@react-navigation/native';
import { RouteNode } from './Route';
import { RouterStore } from './global-state/router-store';
import { getInitialURL, getPathFromState, getStateFromPath } from './link/linking';
import { RequireContext } from './types';
export declare function getNavigationConfig(routes: RouteNode, metaOnly?: boolean): {
    initialRouteName: string | undefined;
    screens: Record<string, import("./getReactNavigationConfig").Screen>;
};
export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
    getPathFromState?: typeof getPathFromState;
    getStateFromPath?: typeof getStateFromPath;
};
export type LinkingConfigOptions = {
    metaOnly?: boolean;
    serverUrl?: string;
    getInitialURL?: typeof getInitialURL;
};
export declare function getLinkingConfig(store: RouterStore, routes: RouteNode, context: RequireContext, { metaOnly, serverUrl }?: LinkingConfigOptions): ExpoLinkingOptions;
//# sourceMappingURL=getLinkingConfig.d.ts.map