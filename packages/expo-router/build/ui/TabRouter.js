"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabRouter = void 0;
const native_1 = require("@react-navigation/native");
function TabRouter({ triggerMap, ...options }) {
    const rnTabRouter = (0, native_1.TabRouter)(options);
    const router = {
        ...rnTabRouter,
        getStateForAction(state, action, options) {
            if (action.type === 'SWITCH_TABS') {
                const name = action.payload.name;
                const payload = triggerMap.get(name);
                if (!payload) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`Unable to switch to tab with name ${name}. Tab does not exist`);
                    }
                    return state;
                }
                action = {
                    type: 'JUMP_TO',
                    ...payload.navigate,
                };
                return rnTabRouter.getStateForAction(state, action, options);
            }
            else {
                return rnTabRouter.getStateForAction(state, action, options);
            }
        },
    };
    return router;
}
exports.TabRouter = TabRouter;
//# sourceMappingURL=TabRouter.js.map