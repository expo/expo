"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouteInfo = void 0;
exports.useLoaderData = useLoaderData;
exports.useRootNavigationState = useRootNavigationState;
exports.useRootNavigation = useRootNavigation;
exports.useNavigationContainerRef = useNavigationContainerRef;
exports.useRouter = useRouter;
exports.useUnstableGlobalHref = useUnstableGlobalHref;
exports.useSegments = useSegments;
exports.usePathname = usePathname;
exports.useGlobalSearchParams = useGlobalSearchParams;
exports.useLocalSearchParams = useLocalSearchParams;
exports.useSearchParams = useSearchParams;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const constants_1 = require("./constants");
const router_store_1 = require("./global-state/router-store");
Object.defineProperty(exports, "useRouteInfo", { enumerable: true, get: function () { return router_store_1.useRouteInfo; } });
const imperative_api_1 = require("./imperative-api");
const PreviewRouteContext_1 = require("./link/preview/PreviewRouteContext");
const context_1 = require("./loaders/context");
const utils_1 = require("./loaders/utils");
const loaderDataCache = new Map();
const loaderPromiseCache = new Map();
/**
 * Returns the data loaded by the route's loader function. This hook only works
 * when `web.output: "server" | "static"` is configured in your app config.
 *
 * @example
 * ```tsx app/index.tsx
 * // Route file
 * export async function loader({ params }) {
 *   return { user: await fetchUser(params.id) };
 * }
 *
 * export default function UserRoute() {
 *   const data = useLoaderData(loader);
 *   return <Text>{data.user.name}</Text>;
 * }
 * ```
 */
function useLoaderData(loader) {
    const pathname = usePathname();
    const segments = useSegments();
    const loaderDataContext = react_1.default.use(context_1.LoaderContext);
    // This is used by the server at build time
    if (loaderDataContext && pathname in loaderDataContext) {
        return loaderDataContext[pathname];
    }
    if (typeof window !== 'undefined') {
        if (!window.__EXPO_ROUTER_LOADER_DATA__) {
            throw new Error('Server data loaders are not enabled. Add `unstable_useServerDataLoaders: true` to your `expo-router` plugin config.');
        }
        // This is used when first loading a page in the browser as the preloaded data should be
        // available as a `<script>` tag in the HTML
        const preloadedData = window.__EXPO_ROUTER_LOADER_DATA__[pathname];
        if (preloadedData !== undefined) {
            return preloadedData;
        }
        // If client-side navigation has already triggered a load for this route, we can re-use the data
        if (loaderDataCache.has(pathname)) {
            return loaderDataCache.get(pathname);
        }
        // Check if a fetch is already in-progress for this route. This is to prevent duplicate network
        // requests when multiple requests for the same route data are received, but before the first
        // fetch has completed
        if (!loaderPromiseCache.has(pathname)) {
            const promise = (0, utils_1.fetchLoaderModule)(pathname, segments)
                .then((data) => {
                loaderDataCache.set(pathname, data);
                loaderPromiseCache.delete(pathname);
                return data;
            })
                .catch((error) => {
                loaderPromiseCache.delete(pathname);
                console.error(`Failed to load loader data for route: ${pathname}:`, error);
                throw new Error(`Failed to load loader data for route: ${pathname}`, { cause: error });
            });
            loaderPromiseCache.set(pathname, promise);
        }
        return react_1.default.use(loaderPromiseCache.get(pathname));
    }
    throw new Error('Server data loaders do not work on the client. They only work with `web.output` set to `static` or `server` in your app config');
}
/**
 * Returns the [navigation state](https://reactnavigation.org/docs/navigation-state/)
 * of the navigator which contains the current screen.
 *
 * @example
 * ```tsx
 * import { useRootNavigationState } from 'expo-router';
 *
 * export default function Route() {
 *  const { routes } = useRootNavigationState();
 *
 *  return <Text>{routes[0].name}</Text>;
 * }
 * ```
 */
function useRootNavigationState() {
    const parent = 
    // We assume that this is called from routes in __root
    // Users cannot customize the generated Sitemap or NotFound routes, so we should be safe
    (0, native_1.useNavigation)().getParent(constants_1.INTERNAL_SLOT_NAME);
    if (!parent) {
        throw new Error('useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.');
    }
    return parent.getState();
}
/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
function useRootNavigation() {
    return router_store_1.store.navigationRef.current;
}
/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
function useNavigationContainerRef() {
    return router_store_1.store.navigationRef;
}
const displayWarningForProp = (prop) => {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`router.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`);
    }
};
const createNOOPWithWarning = (prop) => () => displayWarningForProp(prop);
const routerWithWarnings = {
    back: createNOOPWithWarning('back'),
    canGoBack: () => {
        displayWarningForProp('canGoBack');
        return false;
    },
    push: createNOOPWithWarning('push'),
    navigate: createNOOPWithWarning('navigate'),
    replace: createNOOPWithWarning('replace'),
    dismiss: createNOOPWithWarning('dismiss'),
    dismissTo: createNOOPWithWarning('dismissTo'),
    dismissAll: createNOOPWithWarning('dismissAll'),
    canDismiss: () => {
        displayWarningForProp('canDismiss');
        return false;
    },
    setParams: createNOOPWithWarning('setParams'),
    reload: createNOOPWithWarning('reload'),
    prefetch: createNOOPWithWarning('prefetch'),
};
/**
 *
 * Returns the [Router](#router) object for imperative navigation.
 *
 * @example
 *```tsx
 * import { useRouter } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *  const router = useRouter();
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
function useRouter() {
    const { isPreview } = (0, PreviewRouteContext_1.usePreviewInfo)();
    if (isPreview) {
        return routerWithWarnings;
    }
    return imperative_api_1.router;
}
/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
function useUnstableGlobalHref() {
    return (0, router_store_1.useRouteInfo)().unstable_globalHref;
}
function useSegments() {
    return (0, router_store_1.useRouteInfo)().segments;
}
/**
 * Returns the currently selected route location without search parameters. For example, `/acme?foo=bar` returns `/acme`.
 * Segments will be normalized. For example, `/[id]?id=normal` becomes `/normal`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { usePathname } from 'expo-router';
 *
 * export default function Route() {
 *   // pathname = "/profile/baconbrix"
 *   const pathname = usePathname();
 *
 *   return <Text>Pathname: {pathname}</Text>;
 * }
 * ```
 */
function usePathname() {
    return (0, router_store_1.useRouteInfo)().pathname;
}
function useGlobalSearchParams() {
    return (0, router_store_1.useRouteInfo)().params;
}
function useLocalSearchParams() {
    const params = react_1.default.use(Route_1.LocalRouteParamsContext) ?? {};
    const { params: previewParams } = (0, PreviewRouteContext_1.usePreviewInfo)();
    return Object.fromEntries(Object.entries(previewParams ?? params).map(([key, value]) => {
        // React Navigation doesn't remove "undefined" values from the params object, and you cannot remove them via
        // navigation.setParams as it shallow merges. Hence, we hide them here
        if (value === undefined) {
            return [key, undefined];
        }
        if (Array.isArray(value)) {
            return [
                key,
                value.map((v) => {
                    try {
                        return decodeURIComponent(v);
                    }
                    catch {
                        return v;
                    }
                }),
            ];
        }
        else {
            try {
                return [key, decodeURIComponent(value)];
            }
            catch {
                return [key, value];
            }
        }
    }));
}
function useSearchParams({ global = false } = {}) {
    const globalRef = react_1.default.useRef(global);
    if (process.env.NODE_ENV !== 'production') {
        if (global !== globalRef.current) {
            console.warn(`Detected change in 'global' option of useSearchParams. This value cannot change between renders`);
        }
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const params = global ? useGlobalSearchParams() : useLocalSearchParams();
    const entries = Object.entries(params).flatMap(([key, value]) => {
        if (global) {
            if (key === 'params')
                return [];
            if (key === 'screen')
                return [];
        }
        return Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]];
    });
    return new ReadOnlyURLSearchParams(entries);
}
class ReadOnlyURLSearchParams extends URLSearchParams {
    set() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
    append() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
    delete() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
}
//# sourceMappingURL=hooks.js.map