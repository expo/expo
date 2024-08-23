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
            if (action.type === 'SWITCH_TABS') {
                const name = action.payload.name;
                const trigger = triggerMap[name];
                if (!trigger) {
                    // Maybe this trigger is handled by a parent Tabs?
                    return null;
                }
                else if (trigger.type === 'external') {
                    router_store_1.store.navigate(trigger.href);
                    return state;
                }
                const route = state.routes.find((route) => route.name === trigger.routeNode.route);
                if (!route) {
                    // Maybe we have two <Tabs /> with triggers with the same name, but different routes
                    return null;
                }
                const shouldReset = action.payload.reset === true;
                const historyState = state.history.find((item) => item.key === route?.key);
                if (shouldReset || !historyState) {
                    return rnTabRouter.getStateForAction(state, trigger.action, options);
                }
                else {
                    state = rnTabRouter.getStateForRouteFocus(state, route.key);
                    return state;
                }
            }
            else {
                return rnTabRouter.getStateForAction(state, action, options);
            }
        },
    };
    return router;
}
exports.ExpoTabRouter = ExpoTabRouter;
//# sourceMappingURL=TabRouter.js.map