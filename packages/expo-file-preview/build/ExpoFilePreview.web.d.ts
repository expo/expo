import type { FilePreviewCanPreviewOptions, FilePreviewOpenOptions } from './FilePreview.types';
type ExpoFilePreviewModule = {
    canPreviewAsync?: (uri: string, options: FilePreviewCanPreviewOptions) => Promise<boolean>;
    openPreviewAsync?: (uri: string, options: FilePreviewOpenOptions) => Promise<void>;
};
declare const _default: ExpoFilePreviewModule;
export default _default;
//# sourceMappingURL=ExpoFilePreview.web.d.ts.map