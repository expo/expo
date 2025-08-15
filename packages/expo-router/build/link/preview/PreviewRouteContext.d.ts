import type { UnknownOutputParams } from '../../types';
export interface PreviewRouteContextType {
    params: UnknownOutputParams;
    pathname: string;
    segments: string[];
}
export declare const PreviewRouteContext: import("react").Context<PreviewRouteContextType | undefined>;
type UsePreviewInfo = {
    isPreview: boolean;
} & Partial<PreviewRouteContextType>;
/**
 * Returns information about the current route if it is displayed in preview mode.
 */
export declare function usePreviewInfo(): UsePreviewInfo;
/**
 * Hook to determine if the current route is rendered inside a preview.
 *
 *  @returns {boolean} - True if the current route is rendered inside a preview, false otherwise.
 */
export declare function useIsPreview(): boolean;
export {};
//# sourceMappingURL=PreviewRouteContext.d.ts.map