import { NavigationContainerRefWithCurrent, NavigationState, PartialState, useStateForPath } from '@react-navigation/native';
import { ComponentType } from 'react';
import { RouteNode } from '../Route';
import { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { RedirectConfig } from '../getRoutesCore';
import { UrlObject } from './routeInfo';
import { RequireContext, type Href } from '../types';
import { type LinkToOptions } from './routing';
export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;
export type RouterStore = typeof store;
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
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
};
export declare function useStore(context: RequireContext, linkingConfigOptions: LinkingConfigOptions, serverUrl?: string): {
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
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
};
export declare function useRouteInfo(): UrlObject;
//# sourceMappingURL=router-store.d.ts.map