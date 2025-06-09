import { NavigationContainerRefWithCurrent, NavigationState, PartialState, useStateForPath } from '@react-navigation/native';
import { ComponentType } from 'react';
import { RouteNode } from '../Route';
import { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { RedirectConfig } from '../getRoutesCore';
import { UrlObject } from './routeInfo';
import { RequireContext } from '../types';
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
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
};
export declare function useRouteInfo(): UrlObject;
//# sourceMappingURL=router-store.d.ts.map