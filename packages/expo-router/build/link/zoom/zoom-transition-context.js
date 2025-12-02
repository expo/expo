"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomTransitionTargetContext = exports.ZoomTransitionSourceContext = void 0;
exports.ZoomTransitionTargetContextProvider = ZoomTransitionTargetContextProvider;
const react_1 = require("react");
const ZoomTransitionEnabler_ios_1 = require("./ZoomTransitionEnabler.ios");
const navigationParams_1 = require("../../navigationParams");
const PreviewRouteContext_1 = require("../preview/PreviewRouteContext");
exports.ZoomTransitionSourceContext = (0, react_1.createContext)(undefined);
exports.ZoomTransitionTargetContext = (0, react_1.createContext)({
    identifier: null,
});
function ZoomTransitionTargetContextProvider({ route, children, }) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if ((0, ZoomTransitionEnabler_ios_1.isZoomTransitionEnabled)() &&
        !isPreview &&
        route &&
        typeof route === 'object' &&
        'params' in route &&
        typeof route.params === 'object' &&
        'key' in route &&
        typeof route.key === 'string') {
        const params = route.params ?? {};
        const internalParams = (0, navigationParams_1.getInternalExpoRouterParams)(params);
        const zoomTransitionId = internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
        const zoomTransitionScreenId = internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME];
        const hasZoomTransition = !!zoomTransitionId && zoomTransitionScreenId === route.key;
        if (hasZoomTransition && typeof zoomTransitionId === 'string') {
            return (<exports.ZoomTransitionTargetContext value={{ identifier: zoomTransitionId }}>
          {children}
        </exports.ZoomTransitionTargetContext>);
        }
    }
    return children;
}
//# sourceMappingURL=zoom-transition-context.js.map