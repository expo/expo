"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggersToScreens = void 0;
const native_1 = require("@react-navigation/native");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, native_1.createNavigatorFactory)({})();
function triggersToScreens(triggers, layoutRouteNode, linking, currentGroups, initialRouteName = layoutRouteNode.initialRouteName) {
    const screenConfig = triggers.reduce((acc, { href, initialRoute }) => {
        debugger;
        let state = linking.getStateFromPath?.(href, linking.config)?.routes[0];
        if (!state) {
            return acc;
        }
        if (layoutRouteNode.route) {
            while (state?.state) {
                const previousState = state;
                state = state.state.routes[state.state.index ?? state.state.routes.length - 1];
                if (previousState.name === layoutRouteNode.route)
                    break;
            }
        }
        let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);
        if (routeNode) {
            if (isInitialRoute(initialRoute, currentGroups)) {
                if (process.env.NODE_ENV === 'development') {
                    if (initialRouteName) {
                        console.warn(`Initial route name has been set multiple times`);
                    }
                }
                initialRouteName = routeNode.route;
            }
            acc.push({ routeNode });
        }
        return acc;
    }, []);
    const sortFn = (0, sortRoutes_1.sortRoutesWithInitial)(initialRouteName);
    const children = screenConfig
        .sort((a, b) => sortFn(a.routeNode, b.routeNode))
        .map(({ routeNode }) => (<Screen name={routeNode.route} getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(routeNode)}/>));
    return {
        children,
        initialRouteName,
    };
}
exports.triggersToScreens = triggersToScreens;
function isInitialRoute(initialRoute, groups) {
    let match = false;
    if (initialRoute === true) {
        match = true;
    }
    else if (Array.isArray(initialRoute)) {
        match = initialRoute.some((route) => groups.includes(route));
    }
    else if (typeof initialRoute === 'string') {
        match = groups.includes(initialRoute);
    }
    return match;
}
//# sourceMappingURL=common.js.map