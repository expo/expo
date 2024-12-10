'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchParams = exports.useLocalSearchParams = exports.useGlobalSearchParams = exports.usePathname = exports.useSegments = exports.useUnstableGlobalHref = exports.useRouter = exports.useNavigationContainerRef = exports.useRootNavigation = exports.useRouteInfo = exports.useRootNavigationState = void 0;
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const router_store_1 = require("./global-state/router-store");
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
    return (0, router_store_1.useStoreRootState)();
}
exports.useRootNavigationState = useRootNavigationState;
function useRouteInfo() {
    return (0, router_store_1.useStoreRouteInfo)();
}
exports.useRouteInfo = useRouteInfo;
/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
function useRootNavigation() {
    return router_store_1.store.navigationRef.current;
}
exports.useRootNavigation = useRootNavigation;
/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
function useNavigationContainerRef() {
    return router_store_1.store.navigationRef;
}
exports.useNavigationContainerRef = useNavigationContainerRef;
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
    return react_1.default.useMemo(() => ({
        push: router_store_1.store.push,
        dismiss: router_store_1.store.dismiss,
        dismissAll: router_store_1.store.dismissAll,
        dismissTo: router_store_1.store.dismissTo,
        canDismiss: router_store_1.store.canDismiss,
        back: router_store_1.store.goBack,
        replace: router_store_1.store.replace,
        setParams: router_store_1.store.setParams,
        canGoBack: router_store_1.store.canGoBack,
        navigate: router_store_1.store.navigate,
        reload: router_store_1.store.reload,
    }), []);
}
exports.useRouter = useRouter;
/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
function useUnstableGlobalHref() {
    return (0, router_store_1.useStoreRouteInfo)().unstable_globalHref;
}
exports.useUnstableGlobalHref = useUnstableGlobalHref;
function useSegments() {
    return (0, router_store_1.useStoreRouteInfo)().segments;
}
exports.useSegments = useSegments;
/**
 * Returns the currently selected route location without search parameters. For example, `/acme?foo=bar` returns `/acme`.
 * Segments will be normalized. For example, `/[id]?id=normal` becomes `/normal`.
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
 */
function usePathname() {
    return (0, router_store_1.useStoreRouteInfo)().pathname;
}
exports.usePathname = usePathname;
function useGlobalSearchParams() {
    return (0, router_store_1.useStoreRouteInfo)().params;
}
exports.useGlobalSearchParams = useGlobalSearchParams;
function useLocalSearchParams() {
    const params = react_1.default.useContext(Route_1.LocalRouteParamsContext) ?? {};
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
exports.useSearchParams = useSearchParams;
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