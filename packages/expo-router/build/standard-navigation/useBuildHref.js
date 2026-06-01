"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBuildHref = useBuildHref;
const react_1 = require("react");
const routeInfoCache_1 = require("../global-state/routeInfoCache");
const core_1 = require("../react-navigation/core");
// TODO(@ubax): move route info to state - https://linear.app/expo/issue/ENG-21483/refactor-state-to-include-all-route-info-information
function useBuildHref() {
    const currentState = (0, core_1.useStateForPath)();
    return (0, react_1.useCallback)((route) => {
        const state = {
            routes: [
                {
                    name: route.name,
                    params: route.params,
                },
            ],
        };
        const addState = (parent) => {
            const parentRoute = parent?.routes[0];
            if (parentRoute) {
                return {
                    routes: [
                        {
                            ...parentRoute,
                            state: addState(parentRoute.state),
                        },
                    ],
                };
            }
            return state;
        };
        return (0, routeInfoCache_1.getCachedRouteInfo)(addState(currentState)).pathnameWithParams;
    }, [currentState]);
}
//# sourceMappingURL=useBuildHref.js.map