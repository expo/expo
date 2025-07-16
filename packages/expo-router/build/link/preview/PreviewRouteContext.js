"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewRouteContext = void 0;
exports.usePreviewInfo = usePreviewInfo;
exports.useIsPreview = useIsPreview;
const react_1 = require("react");
exports.PreviewRouteContext = (0, react_1.createContext)(undefined);
/**
 * Returns information about the current route if it is displayed in preview mode.
 */
function usePreviewInfo() {
    const paramsContext = (0, react_1.use)(exports.PreviewRouteContext);
    return {
        isPreview: !!paramsContext,
        ...paramsContext,
    };
}
/**
 * Hook to determine if the current route is rendered inside a preview.
 *
 *  @returns {boolean} - True if the current route is rendered inside a preview, false otherwise.
 */
function useIsPreview() {
    const { isPreview } = usePreviewInfo();
    return isPreview;
}
//# sourceMappingURL=PreviewRouteContext.js.map