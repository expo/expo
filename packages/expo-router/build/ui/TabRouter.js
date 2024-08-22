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
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`Unable to switch to tab with name ${name}. Tab does not exist`);
                    }
                    return state;
                }
                else if (trigger.type === 'internal') {
                    const name = trigger.action.payload.name;
                    const shouldReset = action.payload.reset === true;
                    const isLoaded = state.routes.find((route) => route.name === name);
                    if (shouldReset || !isLoaded) {
                        // Load the tab with the tabs specified route
                        action = trigger.action;
                    }
                    else {
                        // Else swap to the tab
                        action = {
                            type: 'JUMP_TO',
                            payload: {
                                name,
                            },
                        };
                    }
                }
                else {
                    router_store_1.store.navigate(trigger.href);
                    return state;
                }
                return rnTabRouter.getStateForAction(state, action, options);
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