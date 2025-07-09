export declare const StoreContext: import("react").Context<{
    shouldShowTutorial(): boolean;
    readonly state: import("./router-store").ReactNavigationState | undefined;
    readonly navigationRef: import("@react-navigation/core").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(): import("./routeInfo").UrlObject;
    readonly redirects: import("./router-store").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
    getStateForHref(href: import("..").Href, options?: import("./routing").LinkToOptions): (Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("@react-navigation/routers").PartialRoute<import("@react-navigation/routers").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("@react-navigation/routers").PartialRoute<import("@react-navigation/routers").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./router-store").FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
} | null>;
export declare const useExpoRouterStore: () => {
    shouldShowTutorial(): boolean;
    readonly state: import("./router-store").ReactNavigationState | undefined;
    readonly navigationRef: import("@react-navigation/core").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(): import("./routeInfo").UrlObject;
    readonly redirects: import("./router-store").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
    getStateForHref(href: import("..").Href, options?: import("./routing").LinkToOptions): (Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("@react-navigation/routers").PartialRoute<import("@react-navigation/routers").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("@react-navigation/routers").PartialRoute<import("@react-navigation/routers").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined;
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./router-store").FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
};
//# sourceMappingURL=storeContext.d.ts.map