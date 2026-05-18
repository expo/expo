declare global {
    var __EXPO_RSC_RELOAD_LISTENERS__: undefined | (() => void)[];
    var __EXPO_REFETCH_RSC__: undefined | (() => void);
    var __EXPO_REFETCH_ROUTE__: undefined | (() => void);
    var __EXPO_REFETCH_ROUTE_NO_CACHE__: undefined | (() => void);
    /**
     * Data injected by a server data loader for the current route.
     */
    var __EXPO_ROUTER_LOADER_DATA__: Record<string, any> | undefined;
    /**
     * Dev-only listeners fired when the dev server broadcasts a `loader-invalidate` command.
     */
    var __EXPO_LOADER_INVALIDATE_LISTENERS__: undefined | (() => void)[];
    /**
     * Dev-only flag that ensures the default `loader-invalidate` listener is registered once
     * across HMR re-evaluations of the `LoaderCache` module.
     *
     * @see expo-router/src/loaders/LoaderCache.ts
     */
    var __EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__: undefined | true;
}
export {};
//# sourceMappingURL=expo-router-internal-globals.d.ts.map