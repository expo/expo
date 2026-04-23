import type { TabPath } from './native';
import { type ReactNavigationState } from '../../global-state/router-store';
import type { ParamListBase, NavigationRoute } from '../../react-navigation/native';
import type { Href } from '../../types';
export declare function getTabPathFromRootStateByHref(href: Href, rootState: ReactNavigationState): TabPath[];
export declare function getPreloadedRouteFromRootStateByHref(href: Href, rootState: ReactNavigationState): NavigationRoute<ParamListBase, string> | undefined;
export declare function deepEqual(a: {
    [key: string]: any;
} | undefined, b: {
    [key: string]: any;
} | undefined): boolean;
//# sourceMappingURL=utils.d.ts.map