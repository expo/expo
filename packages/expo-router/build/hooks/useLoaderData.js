"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoaderData = useLoaderData;
const react_1 = require("react");
const Route_1 = require("../Route");
const getRouteInfoFromState_1 = require("../global-state/getRouteInfoFromState");
const LoaderCache_1 = require("../loaders/LoaderCache");
const ServerDataLoaderContext_1 = require("../loaders/ServerDataLoaderContext");
const getLoaderData_1 = require("../loaders/getLoaderData");
const utils_1 = require("../loaders/utils");
const native_1 = require("../react-navigation/native");
const useScreens_1 = require("../useScreens");
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
function useLoaderData() {
    const serverDataLoaderContext = (0, react_1.use)(ServerDataLoaderContext_1.ServerDataLoaderContext);
    const loaderCache = (0, react_1.use)(LoaderCache_1.LoaderCacheContext);
    const stateForPath = (0, native_1.useStateForPath)();
    const contextKey = (0, Route_1.useContextKey)();
    const resolvedPath = (0, react_1.useMemo)(() => {
        const routeInfo = (0, getRouteInfoFromState_1.getRouteInfoFromState)(stateForPath);
        const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
        const resolvedPathname = `/${(0, useScreens_1.getSingularId)(contextPath, { params: routeInfo.params })}`;
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
    const result = (0, getLoaderData_1.getLoaderData)({
        resolvedPath,
        cache: loaderCache,
        fetcher: utils_1.fetchLoader,
    });
    if (result instanceof Promise) {
        return (0, react_1.use)(result);
    }
    return result;
}
//# sourceMappingURL=useLoaderData.js.map