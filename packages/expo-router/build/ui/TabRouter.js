"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoTabRouter = ExpoTabRouter;
const native_1 = require("@react-navigation/native");
function ExpoTabRouter(options) {
    const rnTabRouter = (0, native_1.TabRouter)(options);
    const router = {
        ...rnTabRouter,
        getStateForAction(state, action, options) {
            if (isReplaceAction(action)) {
                action = {
                    ...action,
                    type: 'JUMP_TO',
                };
                // Generate the state as if we were using JUMP_TO
                const nextState = rnTabRouter.getStateForAction(state, action, options);
                if (!nextState || nextState.index === undefined || !Array.isArray(nextState.history)) {
                    return null;
                }
                // We can assert that nextState is TabNavigationState here, because we checked for index and history above
                state = nextState;
                // If the state is valid and we didn't JUMP_TO a single history state,
                // then remove the previous state.
                if (state.index !== 0) {
                    const previousIndex = state.index - 1;
                    state = {
                        ...state,
                        key: `${state.key}-replace`,
                        // Omit the previous history entry that we are replacing
                        history: [
                            ...state.history.slice(0, previousIndex),
                            ...state.history.splice(state.index),
                        ],
                    };
                }
            }
            else if (action.type !== 'JUMP_TO') {
                return rnTabRouter.getStateForAction(state, action, options);
            }
            const route = state.routes.find((route) => route.name === action.payload.name);
            if (!route || !state) {
                // This shouldn't occur, but lets just hand it off to the next navigator in case.
                return null;
            }
            // We should reset if this is the first time visiting the route
            let shouldReset = !state.history?.some((item) => item.key === route?.key) && !route.state;
            if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
                shouldReset = state.routes[state.index ?? 0].key !== route.key;
            }
            if (shouldReset) {
                options.routeParamList[route.name] = {
                    ...options.routeParamList[route.name],
                };
                state = {
                    ...state,
                    routes: state.routes.map((r) => {
                        if (r.key !== route.key) {
                            return r;
                        }
                        return { ...r, state: undefined };
                    }),
                };
                return rnTabRouter.getStateForAction(state, action, options);
            }
            else {
                return rnTabRouter.getStateForRouteFocus(state, route.key);
            }
        },
    };
    return router;
}
function isReplaceAction(action) {
    return action.type === 'REPLACE';
}
//# sourceMappingURL=TabRouter.js.map