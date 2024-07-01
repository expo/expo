import type { RouteNode } from './Route';
import { ExpoLinkingOptions } from './getLinkingConfig';
export type Screen = string | {
    path: string;
    screens: Record<string, Screen>;
    _route?: RouteNode;
    initialRouteName?: string;
};
export declare function getReactNavigationScreensConfig(nodes: RouteNode[], metaOnly: boolean): Record<string, Screen>;
export declare function getReactNavigationConfig(routes: RouteNode, metaOnly: boolean): ExpoLinkingOptions['config'];
//# sourceMappingURL=getReactNavigationConfig.d.ts.map