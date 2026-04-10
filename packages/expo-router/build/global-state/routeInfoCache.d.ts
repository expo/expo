import { type UrlObject } from './getRouteInfoFromState';
import type { FocusedRouteState, ReactNavigationState } from './types';
export declare function getCachedRouteInfo(state: ReactNavigationState): UrlObject;
export declare function setCachedRouteInfo(state: FocusedRouteState | ReactNavigationState, routeInfo: UrlObject): void;
export declare const routeInfoSubscribers: Set<() => void>;
export declare const routeInfoSubscribe: (callback: () => void) => () => void;
//# sourceMappingURL=routeInfoCache.d.ts.map