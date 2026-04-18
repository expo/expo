'use client';
import React, { use, useMemo } from 'react';
import { LocalRouteParamsContext, useContextKey } from './Route';
import { INTERNAL_SLOT_NAME } from './constants';
import { getRouteInfoFromState } from './global-state/getRouteInfoFromState';
import { store, useRouteInfo } from './global-state/router-store';
import { router } from './imperative-api';
import { usePreviewInfo } from './link/preview/PreviewRouteContext';
import { LoaderCacheContext } from './loaders/LoaderCache';
import { ServerDataLoaderContext } from './loaders/ServerDataLoaderContext';
import { getLoaderData } from './loaders/getLoaderData';
import { fetchLoader } from './loaders/utils';
import { useNavigation, useStateForPath, } from './react-navigation/native';
import { getSingularId } from './useScreens';
export { useRouteInfo };
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
export function useRootNavigationState() {
    const parent = 
    // We assume that this is called from routes in __root
    // Users cannot customize the generated Sitemap or NotFound routes, so we should be safe
    useNavigation().getParent(INTERNAL_SLOT_NAME);
    if (!parent) {
        throw new Error('useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.');
    }
    return parent.getState();
}
/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
export function useRootNavigation() {
    return store.navigationRef.current;
}
/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
export function useNavigationContainerRef() {
    return store.navigationRef;
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
export function useRouter() {
    const { isPreview } = usePreviewInfo();
    if (isPreview) {
        return routerWithWarnings;
    }
    return router;
}
/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export function useUnstableGlobalHref() {
    return useRouteInfo().unstable_globalHref;
}
export function useSegments() {
    return useRouteInfo().segments;
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
export function usePathname() {
    return useRouteInfo().pathname;
}
export function useGlobalSearchParams() {
    return useRouteInfo().params;
}
export function useLocalSearchParams() {
    const params = React.use(LocalRouteParamsContext) ?? {};
    const { params: previewParams } = usePreviewInfo();
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
export function useSearchParams({ global = false } = {}) {
    const globalRef = React.useRef(global);
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
/**
 * Returns the result of the `loader` function for the calling route.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLoaderData } from 'expo-router';
 *
 * export function loader() {
 *   return Promise.resolve({ foo: 'bar' }};
 * }
 *
 * export default function Route() {
 *  const data = useLoaderData<typeof loader>(); // { foo: 'bar' }
 *
 *  return <Text>Data: {JSON.stringify(data)}</Text>;
 * }
 */
export function useLoaderData() {
    const serverDataLoaderContext = use(ServerDataLoaderContext);
    const loaderCache = use(LoaderCacheContext);
    const stateForPath = useStateForPath();
    const contextKey = useContextKey();
    const resolvedPath = useMemo(() => {
        const routeInfo = getRouteInfoFromState(stateForPath);
        const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
        const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
        const searchString = routeInfo.searchParams?.toString() || '';
        return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
    }, [contextKey, stateForPath]);
    // First invocation of this hook will happen server-side, so we look up the loaded data from context
    if (serverDataLoaderContext) {
        return serverDataLoaderContext[resolvedPath];
    }
    // The second invocation happens after the client has hydrated on initial load, so we look up the data injected
    // by `<PreloadedDataScript />` using `globalThis.__EXPO_ROUTER_LOADER_DATA__`
    if (typeof window !== 'undefined' && globalThis.__EXPO_ROUTER_LOADER_DATA__) {
        if (globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath]) {
            return globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath];
        }
    }
    const result = getLoaderData({
        resolvedPath,
        cache: loaderCache,
        fetcher: fetchLoader,
    });
    if (result instanceof Promise) {
        return use(result);
    }
    return result;
}
//# sourceMappingURL=hooks.js.map