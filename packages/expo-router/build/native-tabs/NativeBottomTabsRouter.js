"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBottomTabsRouter = NativeBottomTabsRouter;
const native_1 = require("@react-navigation/native");
const navigationParams_1 = require("../navigationParams");
function NativeBottomTabsRouter(options) {
    const tabRouter = (0, native_1.TabRouter)({ ...options });
    const nativeTabRouter = {
        ...tabRouter,
        // @ts-expect-error TODO: For some reason this is not typed correctly
        getStateForAction: (state, action, options) => {
            switch (action.type) {
                case 'NAVIGATE': {
                    const newStateFromNavigation = tabRouter.getStateForAction(state, action, options);
                    const index = state.routes.findIndex((route) => route.name === action.payload.name);
                    if (index === -1 || !newStateFromNavigation) {
                        return newStateFromNavigation;
                    }
                    const newState = {
                        ...newStateFromNavigation,
                        routes: newStateFromNavigation.routes.map((route) => {
                            if (route.name !== action.payload.name) {
                                return route;
                            }
                            const expoParams = (0, navigationParams_1.getInternalExpoRouterParams)(action.payload.params);
                            if (route.params && 'screen' in route.params) {
                                expoParams[navigationParams_1.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME] = true;
                            }
                            if (process.env.NODE_ENV !== 'production') {
                                if (expoParams[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]) {
                                    console.warn('Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.');
                                }
                            }
                            // Zoom transition needs to be disabled for navigation inside tabs
                            // Otherwise user can end up in a situation where a view is missing on one tab
                            // because it was used to perform zoom transition on another tab
                            const params = (0, navigationParams_1.removeParams)((0, navigationParams_1.appendInternalExpoRouterParams)(route.params, expoParams), [
                                navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
                                navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
                            ]);
                            return {
                                ...route,
                                params,
                            };
                        }),
                    };
                    return newState;
                }
            }
            return tabRouter.getStateForAction(state, action, options);
        },
    };
    return nativeTabRouter;
}
//# sourceMappingURL=NativeBottomTabsRouter.js.map