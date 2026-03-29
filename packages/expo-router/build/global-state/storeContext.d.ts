export declare const StoreContext: import("react").Context<{
    shouldShowTutorial(): boolean;
    readonly state: import("./types").ReactNavigationState | undefined;
    readonly navigationRef: import("..").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(): import("./getRouteInfoFromState").UrlObject;
    readonly redirects: import("./types").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
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
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./types").FocusedRouteState): void;
    onReady(): void;
    onStateChange(newState: import("./types").ReactNavigationState | undefined): void;
    assertIsReady(): void;
} | null>;
export declare const useExpoRouterStore: () => {
    shouldShowTutorial(): boolean;
    readonly state: import("./types").ReactNavigationState | undefined;
    readonly navigationRef: import("..").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(): import("./getRouteInfoFromState").UrlObject;
    readonly redirects: import("./types").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
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
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./types").FocusedRouteState): void;
    onReady(): void;
    onStateChange(newState: import("./types").ReactNavigationState | undefined): void;
    assertIsReady(): void;
};
//# sourceMappingURL=storeContext.d.ts.map