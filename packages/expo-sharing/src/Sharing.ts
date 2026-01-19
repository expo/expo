import { UnavailabilityError } from 'expo-modules-core';

import { ResolvedSharePayload, SharePayload, SharingOptions } from './Sharing.types';
import SharingNativeModule from './SharingNativeModule';

// @needsAudit
/**
 * Determine if the sharing API can be used in this app.
 * @return A promise that fulfills with `true` if the sharing API can be used, and `false` otherwise.
 */
export async function isAvailableAsync(): Promise<boolean> {
  if (SharingNativeModule) {
    if (SharingNativeModule.isAvailableAsync) {
      return await SharingNativeModule.isAvailableAsync();
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
  if (!SharingNativeModule || !SharingNativeModule.shareAsync) {
    throw new UnavailabilityError('Sharing', 'shareAsync');
  }
  return await SharingNativeModule.shareAsync(url, options);
}

/**
 * TODO: Docs
 */
export function getSharedPayloads(): SharePayload[] {
  return SharingNativeModule.getSharedPayloads();
}

/**
 * TODO: Docs
 */
export async function getResolvedSharedPayloadsAsync(): Promise<ResolvedSharePayload[]> {
  return await SharingNativeModule.getResolvedSharedPayloadsAsync();
}

/**
 * Clears the data shared with the app.
 */
export function clearSharedPayloads(): void {
  SharingNativeModule.clearSharedPayloads();
}
