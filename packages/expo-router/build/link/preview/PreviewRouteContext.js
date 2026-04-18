'use client';
import { createContext, use } from 'react';
export const PreviewRouteContext = createContext(undefined);
/**
 * Returns information about the current route if it is displayed in preview mode.
 */
export function usePreviewInfo() {
    const paramsContext = use(PreviewRouteContext);
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
export function useIsPreview() {
    const { isPreview } = usePreviewInfo();
    return isPreview;
}
//# sourceMappingURL=PreviewRouteContext.js.map