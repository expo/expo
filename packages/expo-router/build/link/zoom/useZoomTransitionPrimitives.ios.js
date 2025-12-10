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
    const zoomTransitionId = (0, react_1.useMemo)(() => !isPreview && process.env.EXPO_OS === 'ios' && (0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)()
        ? (0, non_secure_1.nanoid)()
        : undefined, []);
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
    (0, react_1.useEffect)(() => {
        if (hasZoomSource && !asChild) {
            console.warn('[expo-router] Using zoom transition links without `asChild` prop may lead to unexpected behavior. Please ensure to set `asChild` when using zoom transitions.');
        }
    }, [hasZoomSource, asChild]);
    const zoomTransitionSourceContextValue = (0, react_1.useMemo)(() => {
        if (!zoomTransitionId) {
            return undefined;
        }
        return {
            identifier: zoomTransitionId,
            addSource,
            removeSource,
            canAddSource: !hasZoomSource,
        };
    }, [zoomTransitionId, addSource, removeSource, hasZoomSource]);
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