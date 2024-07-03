"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalSearchParams = exports.useGlobalSearchParams = exports.usePathname = exports.useSegments = exports.useUnstableGlobalHref = exports.useRouter = exports.useNavigationContainerRef = exports.useRootNavigation = exports.useRouteInfo = exports.useRootNavigationState = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const router_store_1 = require("./global-state/router-store");
function useRootNavigationState() {
    return (0, router_store_1.useStoreRootState)();
}
exports.useRootNavigationState = useRootNavigationState;
function useRouteInfo() {
    return (0, router_store_1.useStoreRouteInfo)();
}
exports.useRouteInfo = useRouteInfo;
/** @deprecated use `useNavigationContainerRef()` instead, which returns a React ref. */
function useRootNavigation() {
    return router_store_1.store.navigationRef.current;
}
exports.useRootNavigation = useRootNavigation;
/** @return the root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
function useNavigationContainerRef() {
    return router_store_1.store.navigationRef;
}
exports.useNavigationContainerRef = useNavigationContainerRef;
function useRouter() {
    return react_1.default.useMemo(() => ({
        push: router_store_1.store.push,
        dismiss: router_store_1.store.dismiss,
        dismissAll: router_store_1.store.dismissAll,
        canDismiss: router_store_1.store.canDismiss,
        back: router_store_1.store.goBack,
        replace: router_store_1.store.replace,
        setParams: router_store_1.store.setParams,
        canGoBack: router_store_1.store.canGoBack,
        navigate: router_store_1.store.navigate,
        // TODO(EvanBacon): add `reload`
    }), []);
}
exports.useRouter = useRouter;
/**
 * @private
 * @returns the current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link, i.e. `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`
 */
function useUnstableGlobalHref() {
    return (0, router_store_1.useStoreRouteInfo)().unstable_globalHref;
}
exports.useUnstableGlobalHref = useUnstableGlobalHref;
/**
 * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. e.g. /[id]?id=normal -> ["[id]"]
 *
 * `useSegments` can be typed using an abstract.
 * Consider the following file structure, and strictly typed `useSegments` function:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.js
 *     - followers.js
 *   - settings.js
 * ```
 * This can be strictly typed using the following abstract:
 *
 * ```ts
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
function useSegments() {
    return (0, router_store_1.useStoreRouteInfo)().segments;
}
exports.useSegments = useSegments;
/** @returns global selected pathname without query parameters. */
function usePathname() {
    return (0, router_store_1.useStoreRouteInfo)().pathname;
}
exports.usePathname = usePathname;
/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using `useLocalSearchParams` as these will only
 * update when the route is focused.
 *
 * @see `useLocalSearchParams`
 */
function useGlobalSearchParams() {
    return (0, router_store_1.useStoreRouteInfo)().params;
}
exports.useGlobalSearchParams = useGlobalSearchParams;
/**
 * Returns the URL parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 * For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 */
function useLocalSearchParams() {
    const params = react_1.default.useContext(native_1.NavigationRouteContext)?.params ?? {};
    return Object.fromEntries(Object.entries(params).map(([key, value]) => {
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
exports.useLocalSearchParams = useLocalSearchParams;
//# sourceMappingURL=hooks.js.map