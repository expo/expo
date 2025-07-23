"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBottomTabsRouter = NativeBottomTabsRouter;
const native_1 = require("@react-navigation/native");
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
                            const payload = action.payload;
                            return {
                                ...route,
                                params: route.params
                                    ? {
                                        ...route.params,
                                        __internal__expoRouterPreviewKey: payload.previewKey,
                                    }
                                    : {
                                        __internal__expoRouterPreviewKey: payload.previewKey,
                                    },
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