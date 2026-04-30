import type { ComponentType } from 'react';
import type { ReactNavigationState, StoreRedirects } from './types';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import type { RequireContext } from '../types';
export declare function useStore(context: RequireContext, linkingConfigOptions: LinkingConfigOptions, serverUrl?: string): {
    shouldShowTutorial(): boolean;
    readonly state: ReactNavigationState | undefined;
    readonly navigationRef: import("../react-navigation").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(): import("./getRouteInfoFromState").UrlObject;
    readonly redirects: StoreRedirects[];
    readonly rootComponent: ComponentType<any>;
    getStateForHref(href: import("..").Href, options?: import("./types").LinkToOptions): (Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation/core").NavigationRoute<import("../react-navigation/core").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("../react-navigation/core").PartialRoute<import("../react-navigation/core").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../react-navigation/core").NavigationRoute<import("../react-navigation/core").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("../react-navigation/core").PartialRoute<import("../react-navigation/core").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./types").FocusedRouteState): void;
    onReady(): void;
    onStateChange(newState: ReactNavigationState | undefined): void;
    assertIsReady(): void;
};
//# sourceMappingURL=useStore.d.ts.map