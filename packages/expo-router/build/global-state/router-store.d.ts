import { NavigationContainerRefWithCurrent, NavigationState, PartialState, useStateForPath } from '@react-navigation/native';
import { ComponentType } from 'react';
import { RouteNode } from '../Route';
import { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { RedirectConfig } from '../getRoutesCore';
import { UrlObject } from './routeInfo';
import { Href, RequireContext } from '../types';
import { LinkToOptions, NavigationOptions } from './routing';
export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;
export type RouterStore = typeof store;
export declare const store: {
    shouldShowTutorial(): boolean;
    readonly state: ReactNavigationState | undefined;
    readonly focusedState: import("@react-navigation/core/lib/typescript/src/NavigationFocusedRouteStateContext").FocusedRouteState | undefined;
    readonly navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: RouteNode | null;
    getRouteInfo(state?: FocusedRouteState | ReactNavigationState | undefined): UrlObject;
    readonly redirects: StoreRedirects[];
    readonly rootComponent: ComponentType<any>;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
    navigate: (url: Href, options?: NavigationOptions) => void;
    push: (url: Href, options?: NavigationOptions) => void;
    dismiss: (count?: number) => void;
    dismissAll: () => void;
    dismissTo: (url: Href, options?: NavigationOptions) => void;
    canDismiss: () => boolean;
    replace: (url: Href, options?: NavigationOptions) => void;
    goBack: () => void;
    canGoBack: () => boolean;
    reload: () => void;
    prefetch: (url: Href, options?: NavigationOptions) => void;
    linkTo: (url: Href, options?: LinkToOptions) => void;
    setParams: (params?: Record<string, undefined | string | number | (string | number)[]>) => any;
    routeInfoSnapshot(): UrlObject;
    cleanup(): void;
    subscribeToRootState(callback: () => void): void;
    applyRedirects(url?: string | null, redirects?: StoreRedirects[]): string | undefined;
    readonly rootState: ReactNavigationState | undefined;
    readonly routeInfo: UrlObject;
    rootStateSnapshot(): ReactNavigationState | undefined;
};
export declare function useStore(context: RequireContext, linkingConfigOptions: LinkingConfigOptions, serverUrl?: string): {
    shouldShowTutorial(): boolean;
    readonly state: ReactNavigationState | undefined;
    readonly focusedState: import("@react-navigation/core/lib/typescript/src/NavigationFocusedRouteStateContext").FocusedRouteState | undefined;
    readonly navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: RouteNode | null;
    getRouteInfo(state?: FocusedRouteState | ReactNavigationState | undefined): UrlObject;
    readonly redirects: StoreRedirects[];
    readonly rootComponent: ComponentType<any>;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
    navigate: (url: Href, options?: NavigationOptions) => void;
    push: (url: Href, options?: NavigationOptions) => void;
    dismiss: (count?: number) => void;
    dismissAll: () => void;
    dismissTo: (url: Href, options?: NavigationOptions) => void;
    canDismiss: () => boolean;
    replace: (url: Href, options?: NavigationOptions) => void;
    goBack: () => void;
    canGoBack: () => boolean;
    reload: () => void;
    prefetch: (url: Href, options?: NavigationOptions) => void;
    linkTo: (url: Href, options?: LinkToOptions) => void;
    setParams: (params?: Record<string, undefined | string | number | (string | number)[]>) => any;
    routeInfoSnapshot(): UrlObject;
    cleanup(): void;
    subscribeToRootState(callback: () => void): void;
    applyRedirects(url?: string | null, redirects?: StoreRedirects[]): string | undefined;
    readonly rootState: ReactNavigationState | undefined;
    readonly routeInfo: UrlObject;
    rootStateSnapshot(): ReactNavigationState | undefined;
};
export declare function useRouteInfo(): UrlObject;
/**
 * @deprecated Use useNavigation() instead.
 */
export declare function useStoreRootState(): Readonly<{
    key: string;
    index: number;
    routeNames: string[];
    history?: unknown[];
    routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
    type: string;
    stale: false;
}>;
/**
 * @deprecated Please use useRouterInfo()
 */
export declare function useStoreRouteInfo(): UrlObject;
//# sourceMappingURL=router-store.d.ts.map