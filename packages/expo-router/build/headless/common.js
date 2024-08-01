"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggersToScreens = void 0;
const native_1 = require("@react-navigation/native");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, native_1.createNavigatorFactory)({})();
function triggersToScreens(triggers, layoutRouteNode, linking) {
    let initialRouteName;
    const screenConfig = triggers.reduce((acc, { href, initialRoute }) => {
        let state = linking.getStateFromPath?.(href, linking.config)?.routes[0];
        if (!state) {
            return acc;
        }
        if (layoutRouteNode.route) {
            while (state?.state) {
                const previousState = state;
                state = state.state.routes[0];
                if (previousState.name === layoutRouteNode.route)
                    break;
            }
        }
        let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);
        if (routeNode) {
            // const key = `${routeNode.route}#${index}`;
            if (initialRoute) {
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
//# sourceMappingURL=common.js.map