"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerActions = void 0;
exports.DrawerRouter = DrawerRouter;
const non_secure_1 = require("nanoid/non-secure");
const TabRouter_1 = require("./TabRouter");
exports.DrawerActions = {
    ...TabRouter_1.TabActions,
    openDrawer() {
        return { type: 'OPEN_DRAWER' };
    },
    closeDrawer() {
        return { type: 'CLOSE_DRAWER' };
    },
    toggleDrawer() {
        return { type: 'TOGGLE_DRAWER' };
    },
};
function DrawerRouter({ defaultStatus = 'closed', ...rest }) {
    const router = (0, TabRouter_1.TabRouter)(rest);
    const isDrawerInHistory = (state) => Boolean(state.history?.some((it) => it.type === 'drawer'));
    const addDrawerToHistory = (state) => {
        if (isDrawerInHistory(state)) {
            return state;
        }
        return {
            ...state,
            history: [
                ...state.history,
                {
                    type: 'drawer',
                    status: defaultStatus === 'open' ? 'closed' : 'open',
                },
            ],
        };
    };
    const removeDrawerFromHistory = (state) => {
        if (!isDrawerInHistory(state)) {
            return state;
        }
        return {
            ...state,
            history: state.history.filter((it) => it.type !== 'drawer'),
        };
    };
    const openDrawer = (state) => {
        if (defaultStatus === 'open') {
            return removeDrawerFromHistory(state);
        }
        return addDrawerToHistory(state);
    };
    const closeDrawer = (state) => {
        if (defaultStatus === 'open') {
            return addDrawerToHistory(state);
        }
        return removeDrawerFromHistory(state);
    };
    return {
        ...router,
        type: 'drawer',
        getInitialState({ routeNames, routeParamList, routeGetIdList }) {
            const state = router.getInitialState({
                routeNames,
                routeParamList,
                routeGetIdList,
            });
            return {
                ...state,
                default: defaultStatus,
                stale: false,
                type: 'drawer',
                key: `drawer-${(0, non_secure_1.nanoid)()}`,
            };
        },
        getRehydratedState(partialState, { routeNames, routeParamList, routeGetIdList }) {
            if (partialState.stale === false) {
                return partialState;
            }
            let state = router.getRehydratedState(partialState, {
                routeNames,
                routeParamList,
                routeGetIdList,
            });
            if (isDrawerInHistory(partialState)) {
                // Re-sync the drawer entry in history to correct it if it was wrong
                state = removeDrawerFromHistory(state);
                state = addDrawerToHistory(state);
            }
            return {
                ...state,
                default: defaultStatus,
                type: 'drawer',
                key: `drawer-${(0, non_secure_1.nanoid)()}`,
            };
        },
        getStateForRouteFocus(state, key) {
            const result = router.getStateForRouteFocus(state, key);
            return closeDrawer(result);
        },
        getStateForAction(state, action, options) {
            switch (action.type) {
                case 'OPEN_DRAWER':
                    return openDrawer(state);
                case 'CLOSE_DRAWER':
                    return closeDrawer(state);
                case 'TOGGLE_DRAWER':
                    if (isDrawerInHistory(state)) {
                        return removeDrawerFromHistory(state);
                    }
                    return addDrawerToHistory(state);
                case 'JUMP_TO':
                case 'NAVIGATE':
                case 'NAVIGATE_DEPRECATED': {
                    const result = router.getStateForAction(state, action, options);
                    if (result != null && result.index !== state.index) {
                        return closeDrawer(result);
                    }
                    return result;
                }
                case 'GO_BACK':
                    if (isDrawerInHistory(state)) {
                        return removeDrawerFromHistory(state);
                    }
                    return router.getStateForAction(state, action, options);
                default:
                    return router.getStateForAction(state, action, options);
            }
        },
        actionCreators: exports.DrawerActions,
    };
}
//# sourceMappingURL=DrawerRouter.js.map