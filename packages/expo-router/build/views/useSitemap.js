"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSitemap = useSitemap;
const react_1 = require("react");
const Route_1 = require("../Route");
const router_store_1 = require("../global-state/router-store");
const matchers_1 = require("../matchers");
const routeSegments = (route, parents) => [
    ...parents,
    ...route.route.split('/'),
];
const routeHref = (route, parents) => '/' +
    routeSegments(route, parents)
        .map((segment) => {
        // add an extra layer of entropy to the url for deep dynamic routes
        if ((0, matchers_1.matchDynamicName)(segment)?.deep) {
            return segment + '/' + Date.now();
        }
        // index must be erased but groups can be preserved.
        return segment === 'index' ? '' : segment;
    })
        .filter(Boolean)
        .join('/');
const routeFilename = (route) => {
    const segments = route.contextKey.split('/');
    // join last two segments for layout routes
    if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
        return segments[segments.length - 2] + '/' + segments[segments.length - 1];
    }
    const routeSegmentsCount = route.route.split('/').length;
    // Join the segment count in reverse order
    // This presents files without layout routes as children with all relevant segments.
    return segments.slice(-routeSegmentsCount).join('/');
};
const mapForRoute = (route, parents) => ({
    contextKey: route.contextKey,
    filename: routeFilename(route),
    href: routeHref(route, parents),
    isInitial: route.initialRouteName === route.route,
    isInternal: route.internal ?? false,
    isGenerated: route.generated ?? false,
    children: [...route.children]
        .sort(Route_1.sortRoutes)
        .map((child) => mapForRoute(child, routeSegments(route, parents))),
});
function useSitemap() {
    const sitemap = (0, react_1.useMemo)(() => (router_store_1.store.routeNode ? mapForRoute(router_store_1.store.routeNode, []) : null), [router_store_1.store.routeNode]);
    return sitemap;
}
//# sourceMappingURL=useSitemap.js.map