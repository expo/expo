export declare const StoreContext: import("react").Context<{
    shouldShowTutorial(): boolean;
    readonly state: import("./router-store").ReactNavigationState | undefined;
    readonly focusedState: import("@react-navigation/core/lib/typescript/src/NavigationFocusedRouteStateContext").FocusedRouteState | undefined;
    readonly navigationRef: import("@react-navigation/core").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(state?: import("./router-store").FocusedRouteState | import("./router-store").ReactNavigationState | undefined): import("./routeInfo").UrlObject;
    readonly redirects: import("./router-store").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./router-store").FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
} | null>;
export declare const useExpoRouterStore: () => {
    shouldShowTutorial(): boolean;
    readonly state: import("./router-store").ReactNavigationState | undefined;
    readonly focusedState: import("@react-navigation/core/lib/typescript/src/NavigationFocusedRouteStateContext").FocusedRouteState | undefined;
    readonly navigationRef: import("@react-navigation/core").NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    readonly routeNode: import("../Route").RouteNode | null;
    getRouteInfo(state?: import("./router-store").FocusedRouteState | import("./router-store").ReactNavigationState | undefined): import("./routeInfo").UrlObject;
    readonly redirects: import("./router-store").StoreRedirects[];
    readonly rootComponent: import("react").ComponentType<any>;
    readonly linking: import("../getLinkingConfig").ExpoLinkingOptions | undefined;
    setFocusedState(state: import("./router-store").FocusedRouteState): void;
    onReady(): void;
    assertIsReady(): void;
};
//# sourceMappingURL=storeContext.d.ts.map