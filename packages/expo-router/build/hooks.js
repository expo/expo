"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalSearchParams = exports.useGlobalSearchParams = exports.usePathname = exports.useSegments = exports.useUnstableGlobalHref = exports.useRouter = exports.useRootNavigation = exports.useRouteInfo = exports.useRootNavigationState = void 0;
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
function useRootNavigation() {
    return router_store_1.store.navigationRef.current;
}
exports.useRootNavigation = useRootNavigation;
function useRouter() {
    return react_1.default.useMemo(() => ({
        push: router_store_1.store.push,
        back: router_store_1.store.goBack,
        replace: router_store_1.store.replace,
        setParams: router_store_1.store.setParams,
        canGoBack: router_store_1.store.canGoBack,
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
 * Returns the URL search parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 */
function useLocalSearchParams() {
    return (useOptionalLocalRoute()?.params ?? {});
}
exports.useLocalSearchParams = useLocalSearchParams;
function useOptionalLocalRoute() {
    const route = react_1.default.useContext(native_1.NavigationRouteContext);
    return route;
}
//# sourceMappingURL=hooks.js.map