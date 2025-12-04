import { ParamListBase, type NavigationRoute } from '@react-navigation/native';
import { type ReactNavigationState } from '../../global-state/router-store';
import { Href } from '../../types';
import { TabPath } from './native';
export declare function getTabPathFromRootStateByHref(href: Href, rootState: ReactNavigationState): TabPath[];
export declare function getPreloadedRouteFromRootStateByHref(href: Href, rootState: ReactNavigationState): NavigationRoute<ParamListBase, string> | undefined;
//# sourceMappingURL=utils.d.ts.map