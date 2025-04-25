import type { NavigationState, PartialState } from '@react-navigation/native';
import type { FocusedRouteState } from './router-store';
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
export declare function getRouteInfoFromState(state?: StrictState): UrlObject;
export {};
//# sourceMappingURL=routeInfo.d.ts.map