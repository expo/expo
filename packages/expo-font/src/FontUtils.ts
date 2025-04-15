import { processColor } from 'react-native';

import ExpoFontUtils from './ExpoFontUtils';

interface RenderToImageOptions {
  /**
   * Font family name.
   * @default system default
   */
  fontFamily?: string;
  /**
   * Size of the font.
   * @default 24
   */
  size?: number;
  /**
   * Font color
   * @default 'black'
   */
  color?: string;
}

/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with uri to image.
 * @platform android
 * @platform ios
 */
export async function renderToImageAsync(
  glyphs: string,
  options?: RenderToImageOptions
): Promise<string> {
  return await ExpoFontUtils.renderToImageAsync(glyphs, {
    ...options,
    color: options?.color ? processColor(options.color) : undefined,
  });
}
