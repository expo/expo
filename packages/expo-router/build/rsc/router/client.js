/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRouter = exports.Router = void 0;
const react_1 = require("react");
const common_1 = require("./common");
const router_context_1 = require("./router-context");
const client_1 = require("../client");
const getHref = () => process.env.EXPO_OS === 'web' ? window.location.href : globalThis.expoVirtualLocation.href;
function InnerRouter() {
    const refetch = (0, client_1.useRefetch)();
    const [route] = (0, react_1.useState)(() => (0, router_context_1.parseRoute)(new URL(getHref())));
    const componentIds = (0, common_1.getComponentIds)(route.path);
    // TODO: strip when "is exporting".
    if (process.env.NODE_ENV === 'development') {
        const refetchRoute = () => {
            const loc = (0, router_context_1.parseRoute)(new URL(getHref()));
            const input = (0, common_1.getInputString)(loc.path);
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
    const children = componentIds.reduceRight((acc, id) => (0, react_1.createElement)(client_1.Slot, { id, fallback: acc }, acc), null);
    return (0, react_1.createElement)(router_context_1.RouterContext.Provider, { value: { route } }, children);
}
function Router() {
    const route = (0, router_context_1.parseRoute)(new URL(getHref()));
    const initialInput = (0, common_1.getInputString)(route.path);
    const initialSearchParamsString = route.searchParams.toString();
    const unstable_onFetchData = (data) => { };
    return (0, react_1.createElement)(client_1.Root, { initialInput, initialSearchParamsString, unstable_onFetchData }, (0, react_1.createElement)(InnerRouter));
}
exports.Router = Router;
const notAvailableInServer = (name) => () => {
    throw new Error(`${name} is not in the server`);
};
/**
 * ServerRouter for SSR
 * This is not a public API.
 */
function ServerRouter({ children, route }) {
    return (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(router_context_1.RouterContext.Provider, {
        value: {
            route,
            changeRoute: notAvailableInServer('changeRoute'),
            prefetchRoute: notAvailableInServer('prefetchRoute'),
        },
    }, children));
}
exports.ServerRouter = ServerRouter;
//# sourceMappingURL=client.js.map