"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableZoomTransition = enableZoomTransition;
exports.isZoomTransitionEnabled = isZoomTransitionEnabled;
exports.ZoomTransitionEnabler = ZoomTransitionEnabler;
const navigationParams_1 = require("../navigationParams");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
const native_1 = require("./preview/native");
let _isZoomTransitionEnabled = false;
function enableZoomTransition() {
    console.warn('[expo-router] Zoom transition is an experimental feature. Use at your own risk.');
    _isZoomTransitionEnabled = true;
}
function isZoomTransitionEnabled() {
    return _isZoomTransitionEnabled;
}
function ZoomTransitionEnabler({ route }) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if (isZoomTransitionEnabled() &&
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
            return <native_1.LinkZoomTransitionEnabler zoomTransitionSourceIdentifier={zoomTransitionId}/>;
        }
    }
    return null;
}
//# sourceMappingURL=ZoomTransitionEnabler.ios.js.map