/* eslint-disable no-var */

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
   * Anchor settings of every layout, keyed by context key, injected by the server render. Read
   * on web when async routes are enabled and a layout module has not loaded yet.
   *
   * @see expo-router/src/layoutSettings.ts
   */
  var __EXPO_ROUTER_LAYOUT_SETTINGS__: Record<string, Record<string, unknown>> | undefined;
  /**
   * Dev-only listeners fired when the dev server broadcasts a `loader-invalidate` command.
   */
  var __EXPO_LOADER_INVALIDATE_LISTENERS__: undefined | (() => void)[];
  /**
   * Dev-only flag that ensures the default `loader-invalidate` listener is registered once
   * across HMR re-evaluations of the `LoaderContext` module.
   *
   * @see expo-router/src/loaders/LoaderContext.ts
   */
  var __EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__: undefined | true;
}
