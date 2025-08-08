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
                            const nestedParams = route.params &&
                                'params' in route.params &&
                                typeof route.params.params === 'object' &&
                                route.params.params
                                ? route.params.params
                                : {};
                            const isPreviewNavigation = action.payload.params &&
                                '__internal__expoRouterIsPreviewNavigation' in action.payload.params
                                ? action.payload.params.__internal__expoRouterIsPreviewNavigation
                                : undefined;
                            const previewKeyParams = isPreviewNavigation
                                ? {
                                    __internal__expoRouterIsPreviewNavigation: isPreviewNavigation,
                                }
                                : {};
                            const params = {
                                ...(route.params || {}),
                                ...previewKeyParams,
                                // This is a workaround for the issue with the preview key not being passed to the params
                                // https://github.com/Ubax/react-navigation/blob/main/packages/core/src/useNavigationBuilder.tsx#L573
                                // Another solution would be to propagate the preview key in the useNavigationBuilder,
                                // but that would require us to fork the @react-navigation/core package.
                                params: {
                                    ...nestedParams,
                                    ...previewKeyParams,
                                },
                            };
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