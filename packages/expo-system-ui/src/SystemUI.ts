import { ColorValue, Platform, processColor } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';
import { InterfaceStyle } from './ExpoSystemUI.types';
import { useInterfaceStyle } from './ExpoSystemUIHooks';

/**
 * Changes the root view background color.
 *
 * @example
 * ```ts
 * SystemUI.setBackgroundColorAsync("white");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color: ColorValue): Promise<void> {
  const colorNumber = Platform.OS === 'web' ? color : processColor(color);
  return await ExpoSystemUI.setBackgroundColorAsync(colorNumber);
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

/**
 * Locks the user interface to the given theme.
 *
 * @example
 * ```ts
 * await SystemUI.setSystemThemeAsync("dark");
 * ```
 * @param theme The theme to lock the user interface to.
 */
export async function setInterfaceStyleAsync(theme: InterfaceStyle): Promise<void> {
  return await ExpoSystemUI.setInterfaceStyleAsync(theme);
}

export { InterfaceStyle, useInterfaceStyle };
