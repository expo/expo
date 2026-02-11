"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZoomHref = useZoomHref;
const react_1 = require("react");
const navigationParams_1 = require("../../navigationParams");
const url_1 = require("../../utils/url");
const zoom_transition_context_1 = require("./zoom-transition-context");
function useZoomHref({ href }) {
    const value = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionSourceContext);
    if (!value) {
        throw new Error('[expo-router] useZoomHref must be used within a ZoomTransitionSourceContextProvider. This is most likely a bug in expo-router.');
    }
    const { hasZoomSource, identifier } = value;
    return (0, react_1.useMemo)(() => {
        if (!hasZoomSource) {
            return href;
        }
        if (typeof href === 'string') {
            const { pathname, searchParams } = (0, url_1.parseUrlUsingCustomBase)(href);
            return {
                pathname,
                params: {
                    ...Object.fromEntries(searchParams.entries()),
                    [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: identifier,
                },
            };
        }
        return {
            pathname: href.pathname,
            params: {
                ...(href.params ?? {}),
                [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: identifier,
            },
        };
    }, [href, identifier, hasZoomSource]);
}
//# sourceMappingURL=useZoomHref.ios.js.map