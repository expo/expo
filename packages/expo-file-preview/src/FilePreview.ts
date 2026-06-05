import { UnavailabilityError } from 'expo-modules-core';

import ExpoFilePreview from './ExpoFilePreview';
import type { FilePreviewCanPreviewOptions, FilePreviewOpenOptions } from './FilePreview.types';

// @needsAudit
/**
 * Determines whether the platform can preview a local file.
 * On iOS, this checks whether Quick Look can preview the file.
 * On Android, this checks whether an installed app can handle the file preview intent.
 * Invalid local URIs and files the app cannot read reject instead of returning `false`.
 * @param uri Local file URI to preview. Remote URLs are not supported.
 * @param options Preview options.
 * @return A promise that fulfills with `true` if the file can be previewed, and `false` otherwise.
 */
export async function canPreviewAsync(
  uri: string,
  options: FilePreviewCanPreviewOptions = {}
): Promise<boolean> {
  if (!ExpoFilePreview.canPreviewAsync) {
    throw new UnavailabilityError('FilePreview', 'canPreviewAsync');
  }
  return await ExpoFilePreview.canPreviewAsync(uri, options);
}

// @needsAudit
/**
 * Opens a local file in the platform-native preview flow.
 * On iOS, this presents Quick Look. On Android, this starts an `ACTION_VIEW` intent.
 * @param uri Local file URI to preview. Remote URLs are not supported.
 * @param options Preview options.
 * @return A promise that fulfills when the preview has been opened.
 */
export async function openPreviewAsync(
  uri: string,
  options: FilePreviewOpenOptions = {}
): Promise<void> {
  if (!ExpoFilePreview.openPreviewAsync) {
    throw new UnavailabilityError('FilePreview', 'openPreviewAsync');
  }
  return await ExpoFilePreview.openPreviewAsync(uri, options);
}
