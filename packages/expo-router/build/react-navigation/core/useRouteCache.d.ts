import type { NavigationState, ParamListBase } from '../routers';
import type { RouteProp } from './types';
/**
 * Utilities such as `getFocusedRouteNameFromRoute` need to access state.
 * So we need a way to suppress the warning for those use cases.
 * This is fine since they are internal utilities and this is not public API.
 */
export declare const CHILD_STATE: unique symbol;
/**
 * Hook to cache route props for each screen in the navigator.
 * This lets add warnings and modifications to the route object but keep references between renders.
 */
export declare function useRouteCache<State extends NavigationState>(routes: State['routes']): RouteProp<ParamListBase>[];
//# sourceMappingURL=useRouteCache.d.ts.map