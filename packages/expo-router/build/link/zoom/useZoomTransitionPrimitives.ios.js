"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZoomTransitionPrimitives = useZoomTransitionPrimitives;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const ZoomTransitionEnabler_1 = require("./ZoomTransitionEnabler");
const navigationParams_1 = require("../../navigationParams");
const url_1 = require("../../utils/url");
const PreviewRouteContext_1 = require("../preview/PreviewRouteContext");
function useZoomTransitionPrimitives({ href, asChild }) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    const isExternalHref = typeof href === 'string' ? (0, url_1.shouldLinkExternally)(href) : (0, url_1.shouldLinkExternally)(href.pathname);
    const isZoomTransitionConfigValid = process.env.EXPO_OS === 'ios' &&
        !isPreview &&
        !!(0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)() &&
        !!asChild &&
        !isExternalHref;
    const reason = (0, react_1.useMemo)(() => {
        if (process.env.EXPO_OS !== 'ios' || isPreview) {
            return undefined;
        }
        if (!(0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)()) {
            return 'Zoom transitions are not enabled.';
        }
        if (!asChild) {
            return 'Link must be used with `asChild` prop to enable zoom transitions.';
        }
        if (isExternalHref) {
            return 'Zoom transitions can only be used with internal links.';
        }
        return undefined;
    }, [asChild, isExternalHref]);
    const zoomTransitionId = (0, react_1.useMemo)(non_secure_1.nanoid, []);
    const [numberOfSources, setNumberOfSources] = (0, react_1.useState)(0);
    const addSource = (0, react_1.useCallback)(() => {
        setNumberOfSources((prev) => prev + 1);
    }, []);
    const removeSource = (0, react_1.useCallback)(() => {
        setNumberOfSources((prev) => prev - 1);
    }, []);
    const hasZoomSource = numberOfSources > 0;
    (0, react_1.useEffect)(() => {
        if (numberOfSources > 1) {
            throw new Error('[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.');
        }
    }, [numberOfSources]);
    const zoomTransitionSourceContextValue = (0, react_1.useMemo)(() => ({
        canAddSource: isZoomTransitionConfigValid,
        identifier: zoomTransitionId,
        addSource,
        removeSource,
        reason,
    }), [zoomTransitionId, addSource, removeSource, hasZoomSource, reason, isZoomTransitionConfigValid]);
    const computedHref = (0, react_1.useMemo)(() => {
        if (!hasZoomSource || !zoomTransitionId) {
            return href;
        }
        if (typeof href === 'string') {
            const { pathname, searchParams } = (0, url_1.parseUrlUsingCustomBase)(href);
            return {
                pathname,
                params: {
                    ...Object.fromEntries(searchParams.entries()),
                    [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
                },
            };
        }
        return {
            pathname: href.pathname,
            params: {
                ...(href.params ?? {}),
                [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
            },
        };
    }, [href, zoomTransitionId, hasZoomSource]);
    return { zoomTransitionSourceContextValue, href: computedHref };
}
//# sourceMappingURL=useZoomTransitionPrimitives.ios.js.map