import type { FocusedRouteState } from './types';
import type { NavigationState, PartialState } from '../react-navigation/native';
export type UrlObject = {
    unstable_globalHref: string;
    pathname: string;
    readonly params: Record<string, string | string[]>;
    searchParams: URLSearchParams;
    segments: string[];
    pathnameWithParams: string;
    isIndex: boolean;
};
export declare const defaultRouteInfo: UrlObject;
/**
 * A better typed version of `FocusedRouteState` that is easier to parse
 */
type StrictState = (FocusedRouteState | NavigationState | PartialState<NavigationState>) & {
    routes: {
        key?: string;
        name: string;
        params?: StrictFocusedRouteParams;
        path?: string;
        state?: StrictState;
    }[];
};
type StrictFocusedRouteParams = Record<string, string | string[]> | {
    screen?: string;
    params?: StrictFocusedRouteParams;
};
/**
 * Extends a parent level's route info with one more navigation level, returning the route info for
 * the path up to that level. This is the incremental building block carried in `RouteInfoContext`:
 * each level memoizes `computeRouteInfo(parent, route)`, so the route info (and its reference)
 * changes only when this route's params change. Reducing the focused levels of a full state through
 * it (see {@link routeInfoFromState}) reproduces a whole-state computation.
 *
 * `__root` (the internal slot) contributes nothing — it's unwrapped just like the whole-state walk.
 */
export declare function computeRouteInfo(parent: UrlObject, route: {
    name: string;
    params?: StrictFocusedRouteParams;
}): UrlObject;
/**
 * Builds route info from a full navigation state by reducing each focused level through
 * {@link computeRouteInfo}. Used where a complete state is available outside of React rendering
 * (e.g. the static-render prefetch in `useStore`); the rendered app instead accumulates
 * incrementally via `RouteInfoContext`.
 */
export declare function routeInfoFromState(state?: StrictState): UrlObject;
export {};
//# sourceMappingURL=routeInfo.d.ts.map