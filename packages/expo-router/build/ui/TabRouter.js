"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoTabRouter = void 0;
const native_1 = require("@react-navigation/native");
const router_store_1 = require("../global-state/router-store");
function ExpoTabRouter({ triggerMap, ...options }) {
    const rnTabRouter = (0, native_1.TabRouter)(options);
    const router = {
        ...rnTabRouter,
        getStateForAction(state, action, options) {
            if (action.type !== 'SWITCH_TABS') {
                return rnTabRouter.getStateForAction(state, action, options);
            }
            const name = action.payload.name;
            const trigger = triggerMap[name];
            if (!trigger) {
                // actions are resolved top-down. This is probably for a different navigator
                return null;
            }
            else if (trigger.type === 'external') {
                router_store_1.store.navigate(trigger.href);
                return state;
            }
            const route = state.routes.find((route) => route.name === trigger.routeNode.route);
            if (!route) {
                // This shouldn't occur, but lets just hand it off to the next navigator in case.
                return null;
            }
            // We should reset if this is the first time visiting the route
            let shouldReset = !state.history.some((item) => item.key === route?.key) && !route.state;
            if (!shouldReset && action.payload.reset) {
                switch (action.payload.reset) {
                    case 'never': {
                        shouldReset = false;
                        break;
                    }
                    case 'always': {
                        shouldReset = true;
                        break;
                    }
                    case 'onFocus': {
                        shouldReset = state.routes[state.index].key === route.key;
                        break;
                    }
                    default: {
                        // TypeScript trick to ensure all use-cases are accounted for
                        action.payload.reset;
                    }
                }
            }
            if (shouldReset) {
                options.routeParamList[route.name] = {
                    ...options.routeParamList[route.name],
                    ...trigger.action.payload.params,
                };
                const state2 = rnTabRouter.getStateForAction(state, trigger.action, options);
                return state2;
            }
            else {
                return rnTabRouter.getStateForRouteFocus(state, route.key);
            }
        },
    };
    return router;
}
exports.ExpoTabRouter = ExpoTabRouter;
//# sourceMappingURL=TabRouter.js.map