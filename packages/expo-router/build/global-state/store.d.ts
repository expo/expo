import type { ComponentType } from 'react';
import { type UrlObject } from './routeInfo';
import type { LinkToOptions, ReactNavigationState, StoreRedirects } from './types';
import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import type { RequireContext, Href } from '../types';
export type RouterStore = typeof store;
type StoreRef = {
    navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    routeNode: RouteNode | null;
    rootComponent: ComponentType<any>;
    state?: ReactNavigationState;
    linking?: ExpoLinkingOptions;
    config: any;
    redirects: StoreRedirects[];
    routeInfo?: UrlObject;
    context?: RequireContext;
};
export declare const storeRef: {
    current: StoreRef;
};
/**
 * Subscribers to route info changes. `useRouteInfo` registers here via `useSyncExternalStore`; the
 * store notifies them after a navigation commits so screens (including unfocused ones) re-read the
 * latest route info.
 */
export declare const routeInfoSubscribers: Set<() => void>;
export declare const routeInfoSubscribe: (callback: () => void) => () => void;
export declare function getSplashScreenAnimationFrame(): number | undefined;
export declare function setSplashScreenAnimationFrame(value: number | undefined): void;
export declare function setHasAttemptedToHideSplash(value: boolean): void;
export declare const store: {
    shouldShowTutorial(): boolean;
    readonly state: ReactNavigationState | undefined;
    readonly navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: RouteNode | null;
    getRouteInfo(): UrlObject;
    readonly redirects: StoreRedirects[];
    readonly rootComponent: ComponentType<any>;
    getStateForHref(href: Href, options?: LinkToOptions): (Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation").NavigationRoute<import("../react-navigation").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("../react-navigation").PartialRoute<import("../react-navigation").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../react-navigation").NavigationRoute<import("../react-navigation").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("../react-navigation").PartialRoute<import("../react-navigation").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedRouteInfo(routeInfo: UrlObject): void;
    onReady(): void;
    onStateChange(newState: ReactNavigationState | undefined): void;
    assertIsReady(): void;
};
export {};
//# sourceMappingURL=store.d.ts.map