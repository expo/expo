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
export declare function usePreviewInfo(): UsePreviewInfo;
export {};
//# sourceMappingURL=PreviewRouteContext.d.ts.map