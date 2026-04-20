"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableZoomTransition = disableZoomTransition;
exports.isZoomTransitionEnabled = isZoomTransitionEnabled;
exports.ZoomTransitionEnabler = ZoomTransitionEnabler;
exports.useShouldEnableZoomTransition = useShouldEnableZoomTransition;
const react_1 = require("react");
const zoom_transition_context_1 = require("./zoom-transition-context");
const descriptors_context_1 = require("../../fork/native-stack/descriptors-context");
const navigationParams_1 = require("../../navigationParams");
const stackPresentation_1 = require("../../utils/stackPresentation");
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
    const shouldEnableZoomTransition = useShouldEnableZoomTransition(route);
    const targetContext = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionTargetContext);
    (0, react_1.useLayoutEffect)(() => {
        if (shouldEnableZoomTransition && targetContext?.addEnabler && targetContext?.removeEnabler) {
            targetContext.addEnabler();
            return () => {
                targetContext.removeEnabler();
            };
        }
        return () => { };
    }, [shouldEnableZoomTransition]);
    if (shouldEnableZoomTransition) {
        const params = route.params;
        const zoomTransitionId = params[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
        // Read dismissalBoundsRect from context (set by usePreventZoomTransitionDismissal hook)
        const dismissalBoundsRect = targetContext.dismissalBoundsRect;
        // Read gestureEnabled from the screen descriptor so that gestureEnabled: false
        // automatically blocks the native zoom transition dismissal gesture,
        // even when the user hasn't called usePreventZoomTransitionDismissal().
        const descriptorsMap = (0, react_1.use)(descriptors_context_1.DescriptorsContext);
        const gestureEnabled = descriptorsMap[route.key]?.options?.gestureEnabled;
        const effectiveDismissalBoundsRect = dismissalBoundsRect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null);
        return (<native_1.LinkZoomTransitionEnabler zoomTransitionSourceIdentifier={zoomTransitionId} dismissalBoundsRect={effectiveDismissalBoundsRect}/>);
    }
    return null;
}
/**
 * @internal
 */
function useShouldEnableZoomTransition(route) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if (isZoomTransitionEnabled() &&
        !isPreview &&
        route &&
        typeof route === 'object' &&
        'params' in route &&
        typeof route.params === 'object' &&
        route.params &&
        'key' in route &&
        typeof route.key === 'string') {
        const params = route.params;
        const internalParams = (0, navigationParams_1.getInternalExpoRouterParams)(params);
        const zoomTransitionId = internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
        const zoomTransitionScreenId = internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME];
        const hasZoomTransition = !!zoomTransitionId && zoomTransitionScreenId === route.key;
        if (hasZoomTransition && typeof zoomTransitionId === 'string') {
            // Read gestureEnabled from the screen descriptor so that gestureEnabled: false
            // automatically blocks the native zoom transition dismissal gesture,
            // even when the user hasn't called usePreventZoomTransitionDismissal().
            const descriptorsMap = (0, react_1.use)(descriptors_context_1.DescriptorsContext);
            const isLinkPreviewNavigation = !!internalParams[navigationParams_1.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME];
            const isPresentedAsModal = (0, stackPresentation_1.isModalPresentation)(descriptorsMap[route.key]?.options);
            if (isLinkPreviewNavigation && !isPresentedAsModal) {
                console.warn('[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.');
            }
            else {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=ZoomTransitionEnabler.ios.js.map