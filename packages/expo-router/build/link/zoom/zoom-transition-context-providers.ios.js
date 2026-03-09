"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomTransitionSourceContextProvider = ZoomTransitionSourceContextProvider;
exports.ZoomTransitionTargetContextProvider = ZoomTransitionTargetContextProvider;
const react_1 = require("react");
const ZoomTransitionEnabler_1 = require("./ZoomTransitionEnabler");
const zoom_transition_context_1 = require("./zoom-transition-context");
const navigationParams_1 = require("../../navigationParams");
const url_1 = require("../../utils/url");
const PreviewRouteContext_1 = require("../preview/PreviewRouteContext");
function ZoomTransitionSourceContextProvider({ children, linkProps, }) {
    const { href, asChild } = linkProps;
    const isExternalHref = typeof href === 'string' ? (0, url_1.shouldLinkExternally)(href) : (0, url_1.shouldLinkExternally)(href.pathname);
    const numberOfSources = (0, react_1.useRef)(0);
    const [hasZoomSource, setHasZoomSource] = (0, react_1.useState)(false);
    const zoomTransitionId = (0, react_1.useId)();
    const addSource = (0, react_1.useCallback)(() => {
        if (!(0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)()) {
            throw new Error('[expo-router] Zoom transitions are not enabled.');
        }
        if (numberOfSources.current >= 1) {
            throw new Error('[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.');
        }
        if (!asChild) {
            throw new Error('[expo-router] Link must be used with `asChild` prop to enable zoom transitions.');
        }
        if (isExternalHref) {
            throw new Error('[expo-router] Zoom transitions can only be used with internal links.');
        }
        numberOfSources.current += 1;
        setHasZoomSource(true);
    }, [asChild, isExternalHref]);
    const removeSource = (0, react_1.useCallback)(() => {
        numberOfSources.current -= 1;
        if (numberOfSources.current <= 0) {
            setHasZoomSource(false);
        }
    }, []);
    const value = (0, react_1.useMemo)(() => ({
        identifier: zoomTransitionId,
        hasZoomSource,
        addSource,
        removeSource,
    }), [zoomTransitionId, hasZoomSource, addSource, removeSource]);
    return <zoom_transition_context_1.ZoomTransitionSourceContext value={value}>{children}</zoom_transition_context_1.ZoomTransitionSourceContext>;
}
function ZoomTransitionTargetContextProvider({ route, children, }) {
    const [dismissalBoundsRect, setDismissalBoundsRect] = (0, react_1.useState)(null);
    // TODO(@ubax): Move this logic to within NativeStackView
    // https://linear.app/expo/issue/ENG-19580/remove-hasenabler-logic-from-zoomtransitiontargetcontext
    // This is a temporary solution to detect if zoom transition was enabled for the screen
    // In theory we could do all the checks here and only mount the enabler when all conditions are met
    // However this would require using use(DescriptorsContext) here,
    // which would cause unnecessary re-renders of the entire screen whenever descriptors change
    const [numberOfEnablers, setNumberOfEnablers] = (0, react_1.useState)(0);
    const addEnabler = (0, react_1.useCallback)(() => setNumberOfEnablers((prev) => prev + 1), []);
    const removeEnabler = (0, react_1.useCallback)(() => setNumberOfEnablers((prev) => prev - 1), []);
    const hasEnabler = numberOfEnablers > 0;
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if ((0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)() &&
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
            return (<zoom_transition_context_1.ZoomTransitionTargetContext value={{
                    identifier: zoomTransitionId,
                    dismissalBoundsRect,
                    setDismissalBoundsRect,
                    addEnabler,
                    removeEnabler,
                    hasEnabler,
                }}>
          {children}
        </zoom_transition_context_1.ZoomTransitionTargetContext>);
        }
    }
    return children;
}
//# sourceMappingURL=zoom-transition-context-providers.ios.js.map