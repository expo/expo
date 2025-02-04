"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This is a hack for Expo Router to support Fast Refresh on _layout files
 *
 * Fast Refresh only works when:
 *  - Files only export React Components
 *  - All inverse dependencies only export React Components
 *
 * Expo Router's _layout files support exporting both 'unstable_settings' and 'ErrorBoundary'
 *
 * 'unstable_settings':
 *  - This is a plain object, so it will break Fast Refresh
 *
 * 'ErrorBoundary'
 *  - While this is a React component, it is imported from 'expo-router'
 *  - 'expo-router' has an inverse dependency on _ctx, which is a require.context object
 *
 * 'generateStaticParams'
 *  - This is a function that is not a React Component, so it will break Fast Refresh
 *
 *
 * To resolve this issue, we extend ReactRefresh to flag these exports as React components
 *
 * @see https://reactnative.dev/docs/fast-refresh
 */
if (process.env.NODE_ENV === 'development') {
    if (
    // Should be a string at runtime
    typeof __METRO_GLOBAL_PREFIX__ !== 'undefined' &&
        // Should be set by Metro's require polyfill
        global[__METRO_GLOBAL_PREFIX__ + '__ReactRefresh']) {
        // source: https://github.com/facebook/metro/blob/main/packages/metro-runtime/src/polyfills/require.js
        const Refresh = global[__METRO_GLOBAL_PREFIX__ + '__ReactRefresh'];
        // Keep a reference to the original
        const isLikelyComponentType = Refresh.isLikelyComponentType;
        // Modules can be dereferenced at any time
        const expoRouterExports = new WeakSet();
        Object.assign(Refresh, {
            /*
             * isLikelyComponentType is called twice.
             *   1. Initially with a modules export object
             *   2. With each individual export of a module
             */
            isLikelyComponentType(value) {
                try {
                    if (typeof value === 'object') {
                        if ('unstable_settings' in value) {
                            expoRouterExports.add(value.unstable_settings);
                        }
                        if ('ErrorBoundary' in value) {
                            expoRouterExports.add(value.ErrorBoundary);
                        }
                        if ('generateStaticParams' in value) {
                            expoRouterExports.add(value.generateStaticParams);
                        }
                    }
                }
                catch {
                    // Ignore - we're just trying to avoid breaking Fast Refresh by using exports
                    // that aren't JS objects valid as keys for the WeakSet - like we've seen with
                    // some JSI::HostObject instances that are exported in a module - see #33670
                    // https://github.com/expo/expo/issues/33670
                }
                return expoRouterExports.has(value) || isLikelyComponentType(value);
            },
        });
    }
}
//# sourceMappingURL=fast-refresh.js.map