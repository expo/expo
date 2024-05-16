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
/** @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead, which returns a React `ref`. */
function useRootNavigation() {
    return router_store_1.store.navigationRef.current;
}
exports.useRootNavigation = useRootNavigation;
/** @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
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
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
function useUnstableGlobalHref() {
    return (0, router_store_1.useStoreRouteInfo)().unstable_globalHref;
}
exports.useUnstableGlobalHref = useUnstableGlobalHref;
/**
 * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. For example: `/[id]?id=normal -> ["[id]"]`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useSegments } from 'expo-router';
 *
 * export default function Route() {
 *   // segments = ["profile", "[user]"]
 *   const segments = useSegments();
 *
 *   return <Text>Hello</Text>;
 * }
 * ```
 *
 *
 * `useSegments` can be typed using an abstract. Consider the following file structure, and strictly typed `useSegments` function:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.js
 *     - followers.js
 *   - settings.js
 * ```
 *
 *
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
/**
 * Global selected route location without search parameters. For example, `/acme?foo=bar` -> `/acme`. Segments will be normalized: `/[id]?id=normal` -> `/normal`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useSegments } from 'expo-router';
 *
 * export default function Route() {
 *   // segments = ["profile", "[user]"]</b>
 *   const segments = useSegments();
 *
 *   return <Text>Hello</Text>;
 *
 * }
 * ```
 *
 */
function usePathname() {
    return (0, router_store_1.useStoreRouteInfo)().pathname;
}
exports.usePathname = usePathname;
/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using [`useLocalSearchParams`](#uselocalsearchparams) as these will only
 * update when the route is focused.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * > **Note:** See [local versus global search parameters](/router/reference/search-parameters/#local-versus-global-search-parameters) for usage
 * > information.
 *
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useGlobalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *
 *  // user=baconbrix & extra=info
 *  const { user, extra } = useGlobalSearchParams();
 *  return <Text>User: {user}</Text>;
 * }
 * ```
 *
 */
function useGlobalSearchParams() {
    return (0, router_store_1.useStoreRouteInfo)().params;
}
exports.useGlobalSearchParams = useGlobalSearchParams;
/**
 * Get the URL search parameters for the contextually focused route. For example, `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 *
 * To observe updates even when the invoking route is not focused, use [`useGlobalSearchParams`](#useglobalsearchparams).
 *
 * When `/abc/home` pushes `/123/shop`, `useGlobalSearchParams` returns `{ first: undefined, second: '123' }` on `app/[first]/home.tsx`
 * because the global URL has changed.
 *
 * However, you may want the params to remain `{ first: 'abc' }` to reflect the context of the screen. In this
 * case, you can use `useLocalSearchParams` to ensure the params `{ first: 'abc' }` are still returned in `app/[first]/home.tsx`
 *
 * > **Note:** See [local versus global search parameters](/router/reference/search-parameters/#local-versus-global-search-parameters) for usage
 * > information.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * @example
 * ```ts app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLocalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *  const { user, extra } = useLocalSearchParams();
 *
 *  return <Text>User: {user}</Text>;
 * }
 * ```
 *
 *
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