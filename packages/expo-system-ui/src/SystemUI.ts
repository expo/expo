import { ColorValue, Platform, processColor, Appearance } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';

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

export type SystemBarStyle = 'auto' | 'light' | 'dark';

export type SystemBarsConfig = {
  statusBarStyle?: SystemBarStyle;
  navigationBarStyle?: SystemBarStyle;
  statusBarHidden?: boolean;
  navigationBarHidden?: boolean;
};

export function setSystemBarsConfig(config: SystemBarsConfig) {
  const { statusBarStyle, navigationBarStyle } = config;
  const colorScheme = Appearance.getColorScheme() ?? 'light';
  const autoBarStyle = colorScheme === 'light' ? 'dark' : 'light';

  ExpoSystemUI.setSystemBarsConfig({
    statusBarStyle: statusBarStyle === 'auto' ? autoBarStyle : statusBarStyle,
    navigationBarStyle: navigationBarStyle === 'auto' ? autoBarStyle : navigationBarStyle,
    statusBarHidden: config.statusBarHidden,
    navigationBarHidden: config.navigationBarHidden,
  });
}
