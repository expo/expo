import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { ComponentType } from 'react';
import { LinkToOptions } from './routing';
import { UrlObject } from '../LocationProvider';
import { RouteNode } from '../Route';
import { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { Href, RequireContext } from '../types';
type ResultState = any;
/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
export declare class RouterStore {
    routeNode: RouteNode | null;
    rootComponent: ComponentType;
    linking?: ExpoLinkingOptions;
    private hasAttemptedToHideSplash;
    initialState?: ResultState;
    rootState?: ResultState;
    nextState?: ResultState;
    routeInfo?: UrlObject;
    splashScreenAnimationFrame?: number;
    navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    navigationRefSubscription: () => void;
    rootStateSubscribers: Set<() => void>;
    storeSubscribers: Set<() => void>;
    linkTo: any;
    getSortedRoutes: any;
    goBack: any;
    canGoBack: any;
    push: any;
    dismiss: any;
    dismissTo: any;
    replace: any;
    dismissAll: any;
    canDismiss: any;
    setParams: any;
    navigate: any;
    reload: any;
    initialize(context: RequireContext, navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>, linkingConfigOptions?: LinkingConfigOptions): void;
    updateState(state: ResultState, nextState?: any): void;
    getRouteInfo(state: ResultState): UrlObject;
    shouldShowTutorial(): boolean;
    /** Make sure these are arrow functions so `this` is correctly bound */
    subscribeToRootState: (subscriber: () => void) => () => boolean;
    subscribeToStore: (subscriber: () => void) => () => boolean;
    snapshot: () => this;
    rootStateSnapshot: () => any;
    routeInfoSnapshot: () => UrlObject;
    cleanup(): void;
    getStateFromPath(href: Href, options?: LinkToOptions): (Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true | undefined;
        routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
    }> & {
        state?: (Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true | undefined;
            routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
        }> & any) | undefined;
    }) | undefined;
}
export declare const store: RouterStore;
export declare function useExpoRouter(): RouterStore;
export declare function useStoreRootState(): any;
export declare function useStoreRouteInfo(): UrlObject;
export declare function useInitializeExpoRouter(context: RequireContext, options: LinkingConfigOptions): RouterStore;
export {};
//# sourceMappingURL=router-store.d.ts.map