"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableZoomTransition = disableZoomTransition;
exports.isZoomTransitionEnabled = isZoomTransitionEnabled;
exports.ZoomTransitionEnabler = ZoomTransitionEnabler;
const react_1 = require("react");
const descriptors_context_1 = require("../../fork/native-stack/descriptors-context");
const navigationParams_1 = require("../../navigationParams");
const PreviewRouteContext_1 = require("../preview/PreviewRouteContext");
const native_1 = require("../preview/native");
let _isZoomTransitionEnabled = process.env.EXPO_OS === 'ios';
function disableZoomTransition() {
    _isZoomTransitionEnabled = false;
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
        const isLinkPreviewNavigation = !!internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME];
        const hasZoomTransition = !!zoomTransitionId && zoomTransitionScreenId === route.key && !isLinkPreviewNavigation;
        if (hasZoomTransition && typeof zoomTransitionId === 'string') {
            const descriptorsMap = (0, react_1.use)(descriptors_context_1.DescriptorsContext);
            const currentDescriptor = descriptorsMap[route.key];
            const preventInteractiveDismissal = currentDescriptor?.options?.gestureEnabled === false;
            return (<native_1.LinkZoomTransitionEnabler zoomTransitionSourceIdentifier={zoomTransitionId} preventInteractiveDismissal={preventInteractiveDismissal}/>);
        }
    }
    return null;
}
//# sourceMappingURL=ZoomTransitionEnabler.ios.js.map