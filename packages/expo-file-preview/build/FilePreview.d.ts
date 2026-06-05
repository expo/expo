import type { FilePreviewCanPreviewOptions, FilePreviewOpenOptions } from './FilePreview.types';
/**
 * Determines whether the platform can preview a local file.
 * On iOS, this checks whether Quick Look can preview the file.
 * On Android, this checks whether an installed app can handle the file preview intent.
 * Invalid local URIs and files the app cannot read reject instead of returning `false`.
 * @param uri Local file URI to preview. Remote URLs are not supported.
 * @param options Preview options.
 * @return A promise that fulfills with `true` if the file can be previewed, and `false` otherwise.
 */
export declare function canPreviewAsync(uri: string, options?: FilePreviewCanPreviewOptions): Promise<boolean>;
/**
 * Opens a local file in the platform-native preview flow.
 * On iOS, this presents Quick Look. On Android, this starts an `ACTION_VIEW` intent.
 * @param uri Local file URI to preview. Remote URLs are not supported.
 * @param options Preview options.
 * @return A promise that fulfills when the preview has been opened.
 */
export declare function openPreviewAsync(uri: string, options?: FilePreviewOpenOptions): Promise<void>;
//# sourceMappingURL=FilePreview.d.ts.map