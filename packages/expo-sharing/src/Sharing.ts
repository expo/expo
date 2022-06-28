import { UnavailabilityError } from 'expo-modules-core';

import Sharing from './ExpoSharing';

// @needsAudit
export type SharingOptions = {
  /**
   * Sets `mimeType` for `Intent`.
   * @platform android
   */
  mimeType?: string;
  /**
   * [Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html)
   *  - the type of the target file.
   * @platform ios
   */
  UTI?: string;
  /**
   * Sets share dialog title.
   * @platform android
   * @platform web
   */
  dialogTitle?: string;
};

// @needsAudit
/**
 * Determine if the sharing API can be used in this app.
 * @return A promise that fulfills with `true` if the sharing API can be used, and `false` otherwise.
 */
export async function isAvailableAsync(): Promise<boolean> {
  if (Sharing) {
    if (Sharing.isAvailableAsync) {
      return await Sharing.isAvailableAsync();
    }
    return true;
  }

  return false;
}

// @needsAudit
/**
 * Opens action sheet to share file to different applications which can handle this type of file.
 * @param url Local file URL to share.
 * @param options A map of share options.
 */
export async function shareAsync(url: string, options: SharingOptions = {}): Promise<void> {
  if (!Sharing || !Sharing.shareAsync) {
    throw new UnavailabilityError('Sharing', 'shareAsync');
  }
  return await Sharing.shareAsync(url, options);
}
