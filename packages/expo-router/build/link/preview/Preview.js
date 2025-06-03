"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewParamsContext = void 0;
exports.Preview = Preview;
exports.getParamsAndNodeFromHref = getParamsAndNodeFromHref;
const react_1 = require("react");
const router_store_1 = require("../../global-state/router-store");
const useNavigation_1 = require("../../useNavigation");
const useScreens_1 = require("../../useScreens");
const href_1 = require("../href");
exports.PreviewParamsContext = (0, react_1.createContext)(undefined);
function Preview({ href }) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const { routeNode, params } = getParamsAndNodeFromHref(href);
    if (!routeNode) {
        return null;
    }
    const Component = (0, useScreens_1.getQualifiedRouteComponent)(routeNode);
    return (<exports.PreviewParamsContext.Provider value={params}>
      <Component navigation={navigation}/>
    </exports.PreviewParamsContext.Provider>);
}
function getParamsAndNodeFromHref(href) {
    let state = getStateForHref(href)?.routes[0]?.state;
    let routeNode = router_store_1.store.routeNode;
    const params = {};
    while (state && routeNode) {
        const route = state.routes[state.index || state.routes.length - 1];
        Object.assign(params, route.params);
        state = route.state;
        routeNode = routeNode.children.find((child) => child.route === route.name);
    }
    return { params, routeNode };
}
function getStateForHref(href, options = {}) {
    href = (0, href_1.resolveHref)(href);
    href = (0, href_1.resolveHrefStringWithSegments)(href, router_store_1.store.getRouteInfo(), options);
    return router_store_1.store.linking?.getStateFromPath(href, router_store_1.store.linking.config);
}
//# sourceMappingURL=Preview.js.map