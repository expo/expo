"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggersToScreens = void 0;
const native_1 = require("@react-navigation/native");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, native_1.createNavigatorFactory)({})();
function triggersToScreens(triggers, layoutRouteNode, linking, initialRouteName) {
    const configs = [];
    for (const { href } of triggers) {
        let state = linking.getStateFromPath?.(href, linking.config)?.routes[0];
        if (!state) {
            continue;
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
        if (!routeNode) {
            continue;
        }
        configs.push({ routeNode });
    }
    const sortFn = (0, sortRoutes_1.sortRoutesWithInitial)(initialRouteName);
    const children = configs
        .sort((a, b) => sortFn(a.routeNode, b.routeNode))
        .map(({ routeNode }) => (<Screen key={routeNode.route} name={routeNode.route} getId={(0, useScreens_1.createGetIdForRoute)(routeNode)} getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(routeNode)} options={(0, useScreens_1.screenOptionsFactory)(routeNode)}/>));
    return {
        children,
    };
}
exports.triggersToScreens = triggersToScreens;
//# sourceMappingURL=common.js.map