"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRouter = void 0;
const non_secure_1 = require("nanoid/non-secure");
/**
 * Base router object that can be used when writing custom routers.
 * This provides few helper methods to handle common actions such as `RESET`.
 */
exports.BaseRouter = {
    getStateForAction(state, action) {
        switch (action.type) {
            case 'SET_PARAMS':
            case 'REPLACE_PARAMS': {
                const index = action.source
                    ? state.routes.findIndex((r) => r.key === action.source)
                    : state.index;
                if (index === -1) {
                    return null;
                }
                return {
                    ...state,
                    routes: state.routes.map((r, i) => i === index
                        ? {
                            ...r,
                            params: action.type === 'REPLACE_PARAMS'
                                ? action.payload.params
                                : { ...r.params, ...action.payload.params },
                        }
                        : r),
                };
            }
            case 'RESET': {
                const nextState = action.payload;
                if (nextState.routes.length === 0 ||
                    nextState.routes.some((route) => !state.routeNames.includes(route.name))) {
                    return null;
                }
                if (nextState.stale === false) {
                    if (state.routeNames.length !== nextState.routeNames.length ||
                        nextState.routeNames.some((name) => !state.routeNames.includes(name))) {
                        return null;
                    }
                    return {
                        ...nextState,
                        routes: nextState.routes.map((route) => route.key ? route : { ...route, key: `${route.name}-${(0, non_secure_1.nanoid)()}` }),
                    };
                }
                return nextState;
            }
            default:
                return null;
        }
    },
    shouldActionChangeFocus(action) {
        return action.type === 'NAVIGATE' || action.type === 'NAVIGATE_DEPRECATED';
    },
};
//# sourceMappingURL=BaseRouter.js.map