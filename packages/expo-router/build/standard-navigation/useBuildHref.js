"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBuildHref = useBuildHref;
const react_1 = require("react");
const getRouteInfoFromState_1 = require("../global-state/getRouteInfoFromState");
const core_1 = require("../react-navigation/core");
// TODO(@ubax): move route info to state - https://linear.app/expo/issue/ENG-21483/refactor-state-to-include-all-route-info-information
function useBuildHref() {
    const currentState = (0, core_1.useStateForPath)();
    return (0, react_1.useMemo)(() => {
        const cache = new WeakMap();
        return (route) => {
            const cached = cache.get(route);
            if (cached !== undefined) {
                return cached;
            }
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
            const href = (0, getRouteInfoFromState_1.getRouteInfoFromState)(addState(currentState)).pathnameWithParams;
            cache.set(route, href);
            return href;
        };
    }, [currentState]);
}
//# sourceMappingURL=useBuildHref.js.map