import type { FilePreviewCanPreviewOptions, FilePreviewOpenOptions } from './FilePreview.types';

type ExpoFilePreviewModule = {
  canPreviewAsync?: (uri: string, options: FilePreviewCanPreviewOptions) => Promise<boolean>;
  openPreviewAsync?: (uri: string, options: FilePreviewOpenOptions) => Promise<void>;
};

export default {} as ExpoFilePreviewModule;
