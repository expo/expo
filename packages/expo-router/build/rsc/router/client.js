/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/client.ts#L1
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRouter = exports.Router = void 0;
const react_1 = require("react");
const common_js_1 = require("./common.js");
const host_js_1 = require("./host.js");
const parseRoute = (url) => {
    const { pathname, searchParams } = url;
    if (searchParams.has(common_js_1.PARAM_KEY_SKIP)) {
        console.warn(`The search param "${common_js_1.PARAM_KEY_SKIP}" is reserved`);
    }
    return { path: pathname, searchParams };
};
const getHref = () => process.env.EXPO_OS === 'web'
    ? window.location.href
    : // TODO: This is hardcoded on native to simplify the initial PR.
        'http://localhost:8081/';
const RouterContext = (0, react_1.createContext)(null);
function InnerRouter() {
    const refetch = (0, host_js_1.useRefetch)();
    const [route] = (0, react_1.useState)(() => parseRoute(new URL(getHref())));
    const componentIds = (0, common_js_1.getComponentIds)(route.path);
    // TODO: strip when "is exporting".
    if (process.env.NODE_ENV === 'development') {
        const refetchRoute = () => {
            const loc = parseRoute(new URL(getHref()));
            const input = (0, common_js_1.getInputString)(loc.path);
            refetch(input, loc.searchParams);
        };
        globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
        const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__EXPO_REFETCH_ROUTE__);
        if (index !== -1) {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
        }
        else {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
        }
        globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
    }
    return (0, react_1.createElement)(RouterContext.Provider, { value: { route } }, componentIds.reduceRight((acc, id) => (0, react_1.createElement)(
    // @ts-expect-error
    host_js_1.Slot, { id, fallback: acc }, acc), null));
}
function Router() {
    const route = parseRoute(new URL(getHref()));
    const initialInput = (0, common_js_1.getInputString)(route.path);
    const initialSearchParamsString = route.searchParams.toString();
    const unstable_onFetchData = () => { };
    return (0, react_1.createElement)(host_js_1.Root, { initialInput, initialSearchParamsString, unstable_onFetchData }, (0, react_1.createElement)(InnerRouter));
}
exports.Router = Router;
/**
 * ServerRouter for SSR
 * This is not a public API.
 */
function ServerRouter({ children, route }) {
    return (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(RouterContext.Provider, {
        value: {
            route,
        },
    }, children));
}
exports.ServerRouter = ServerRouter;
//# sourceMappingURL=client.js.map