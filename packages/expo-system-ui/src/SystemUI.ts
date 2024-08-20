import Constants from 'expo-constants';
import { ColorValue, Platform, processColor } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';

declare global {
  /**
   * This variable is set to true when edge to edge mode is enabled
   * @example
   * if (__EDGE_TO_EDGE__) console.log('Edge to edge mode is enabled')
   */
  const __EDGE_TO_EDGE__: boolean;
}

// @ts-ignore
global.__EDGE_TO_EDGE__ = Constants.expoConfig?.experiments?.edgeToEdge ?? false;

/**
 * Changes the root view background color.
 * Call this function in the root file outside of you component.
 *
 * @example
 * ```ts
 * SystemUI.setBackgroundColorAsync("black");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color: ColorValue | null): Promise<void> {
  if (color == null) {
    return await ExpoSystemUI.setBackgroundColorAsync(null);
  } else {
    const colorNumber = Platform.OS === 'web' ? color : processColor(color);
    return await ExpoSystemUI.setBackgroundColorAsync(colorNumber);
  }
}

/**
 * Gets the root view background color.
 *
 * @example
 * ```ts
 * const color = await SystemUI.getBackgroundColorAsync();
 * ```
 * @returns Current root view background color in hex format. Returns `null` if the background color is not set.
 */
export async function getBackgroundColorAsync(): Promise<ColorValue | null> {
  return await ExpoSystemUI.getBackgroundColorAsync();
}
