import { UnavailabilityError } from 'expo-modules-core';
import { processColor } from 'react-native';

import ExpoFontUtils from './ExpoFontUtils';
import type { RenderToImageOptions, RenderToImageResult } from './FontUtils.types';

export type { RenderToImageOptions, RenderToImageResult };

/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with image metadata.
 * @platform android
 * @platform ios
 */
export async function renderToImageAsync(
  glyphs: string,
  options?: RenderToImageOptions
): Promise<RenderToImageResult> {
  if (!ExpoFontUtils) {
    throw new UnavailabilityError('expo-font', 'ExpoFontUtils.renderToImageAsync');
  }

  return await ExpoFontUtils.renderToImageAsync(glyphs, {
    ...options,
    color: options?.color ? processColor(options.color) : undefined,
  });
}
